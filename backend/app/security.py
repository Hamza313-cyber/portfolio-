"""Security checks. Every check fails closed in production: if something is not
configured, the request is refused instead of let through."""

from __future__ import annotations

import hashlib
import hmac
import logging

import httpx
from fastapi import Depends, HTTPException, Request, status

from .config import Settings, get_settings

log = logging.getLogger("security")

DEV_ADMIN_TOKEN = "dev-admin"  # accepted only outside production, for local testing


def client_ip(request: Request) -> str:
    # Vercel sets these headers itself and overwrites any value sent by the visitor.
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def hash_ip(ip: str, salt: str) -> str:
    # Keyed hash, so stored values cannot be reversed into real IP addresses.
    return hmac.new(salt.encode() or b"dev-salt", ip.encode(), hashlib.sha256).hexdigest()


def check_origin(request: Request, settings: Settings = Depends(get_settings)) -> None:
    """CSRF defence for requests that change data: the browser's Origin must be ours."""
    allowed = settings.allowed_origins
    if not allowed:
        if settings.is_production:
            log.error("ALLOWED_ORIGINS is not set; refusing write request")
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Request not allowed.")
        return
    origin = request.headers.get("origin")
    if origin not in allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Request not allowed.")


async def verify_turnstile(token: str, ip: str, settings: Settings) -> bool:
    if not settings.turnstile_secret:
        # No CAPTCHA configured: allowed only in local development.
        if settings.is_production:
            log.error("turnstile: TURNSTILE_SECRET_KEY is not set in production")
        return not settings.is_production
    if not token:
        return False
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={"secret": settings.turnstile_secret, "response": token, "remoteip": ip},
            )
        data = resp.json()
        if not data.get("success"):
            # Cloudflare's reason codes only; never the secret or the token.
            log.warning("turnstile rejected: error-codes=%s hostname=%s",
                        data.get("error-codes"), data.get("hostname"))
        return bool(data.get("success"))
    except (httpx.HTTPError, ValueError):
        log.exception("turnstile verification failed")
        return False


async def require_admin(request: Request, settings: Settings = Depends(get_settings)) -> str:
    """Returns the admin's user id, or raises 401/403."""
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Please log in.")
    token = auth[7:].strip()
    if not token or len(token) > 4096:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Please log in.")

    if not settings.has_database:
        if not settings.is_production and hmac.compare_digest(token, DEV_ADMIN_TOKEN):
            return "dev-admin"
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Please log in.")

    # Ask Supabase Auth who this token belongs to. Invalid or expired tokens get 401.
    api_key = settings.supabase_publishable_key or settings.supabase_secret_key
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(f"{settings.supabase_url}/auth/v1/user",
                                    headers={"apikey": api_key, "Authorization": f"Bearer {token}"})
    except httpx.HTTPError:
        log.exception("supabase auth lookup failed")
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Login check is unavailable. Try again shortly.")
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your session has expired. Please log in again.")

    user_id = str(resp.json().get("id", ""))
    if not settings.admin_user_ids or user_id not in settings.admin_user_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is not an admin.")
    return user_id

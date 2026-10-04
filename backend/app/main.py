"""Portfolio API (FastAPI). All public paths live under /api because Vercel routes
/api/* to this service and passes the full path through."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .config import Settings, get_settings
from .db import DEFAULT_PROJECTS, DatabaseError, MemoryRepo, Repo, SupabaseRepo
from .models import ContactIn, Message, MessageStatusIn, Project, ProjectIn
from .security import check_origin, client_ip, hash_ip, require_admin, verify_turnstile

log = logging.getLogger("api")
MAX_BODY_BYTES = 20_000

_settings = get_settings()
app = FastAPI(
    title="Tabish Portfolio API",
    # Interactive docs are handy locally but are switched off in production.
    docs_url=None if _settings.is_production else "/api/docs",
    redoc_url=None,
    openapi_url=None if _settings.is_production else "/api/openapi.json",
)

_memory_repo = MemoryRepo(DEFAULT_PROJECTS)


def get_repo(settings: Settings = Depends(get_settings)) -> Repo:
    if settings.has_database:
        return SupabaseRepo(settings.supabase_url, settings.supabase_secret_key)
    if settings.is_production:
        log.error("Supabase is not configured in production")
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Service is not available right now.")
    return _memory_repo


# ---------- middleware and error handling ----------

@app.middleware("http")
async def guard(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
        return JSONResponse({"detail": "Request is too large."}, status_code=413)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if request.url.path.startswith("/api/admin"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    # Report which field is wrong without echoing what was sent.
    problems = [{"field": ".".join(str(p) for p in e["loc"][1:]) or "body", "message": e["msg"]}
                for e in exc.errors()]
    return JSONResponse({"detail": "Please check the form.", "problems": problems}, status_code=422)


@app.exception_handler(DatabaseError)
async def database_error(_: Request, exc: DatabaseError):
    log.error("%s", exc)
    return JSONResponse({"detail": "Service is not available right now. Please try again shortly."},
                        status_code=503)


# ---------- public routes ----------

public = APIRouter(prefix="/api")


@public.get("/health")
async def health():
    return {"ok": True}


@public.get("/projects", response_model=list[Project])
async def projects(response: Response, repo: Repo = Depends(get_repo)):
    response.headers["Cache-Control"] = "public, s-maxage=300, stale-while-revalidate=600"
    return await repo.list_projects(published_only=True)


@public.post("/contact", status_code=status.HTTP_201_CREATED, dependencies=[Depends(check_origin)])
async def contact(body: ContactIn, request: Request, repo: Repo = Depends(get_repo),
                  settings: Settings = Depends(get_settings)):
    if body.website:  # honeypot filled in: almost certainly a bot
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your message could not be sent.")

    ip = client_ip(request)
    if not await verify_turnstile(body.turnstile_token, ip, settings):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please complete the security check and try again.")

    ip_hash = hash_ip(ip, settings.ip_salt)
    since = datetime.now(timezone.utc) - timedelta(minutes=settings.rate_limit_minutes)
    if await repo.count_recent_messages(ip_hash, since) >= settings.rate_limit_count:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            f"Too many messages. Please wait {settings.rate_limit_minutes} minutes and try again.")

    await repo.insert_message({
        "name": body.name,
        "email": str(body.email),
        "message": body.message,
        "ip_hash": ip_hash,
        "user_agent": request.headers.get("user-agent", "")[:300],
    })
    return {"ok": True}


# ---------- admin routes (login required) ----------

admin = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])


def _uuid(value: str) -> str:
    try:
        return str(uuid.UUID(value))
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found.")


@admin.get("/messages", response_model=list[Message])
async def list_messages(limit: int = Query(100, ge=1, le=200), repo: Repo = Depends(get_repo)):
    return await repo.list_messages(limit)


@admin.patch("/messages/{message_id}", dependencies=[Depends(check_origin)])
async def set_message_status(message_id: str, body: MessageStatusIn, repo: Repo = Depends(get_repo)):
    if not await repo.update_message_status(_uuid(message_id), body.status):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found.")
    return {"ok": True}


@admin.get("/projects", response_model=list[Project])
async def all_projects(repo: Repo = Depends(get_repo)):
    return await repo.list_projects(published_only=False)


@admin.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED,
            dependencies=[Depends(check_origin)])
async def create_project(body: ProjectIn, repo: Repo = Depends(get_repo)):
    return await repo.create_project(body.to_row())


@admin.put("/projects/{project_id}", response_model=Project, dependencies=[Depends(check_origin)])
async def update_project(project_id: str, body: ProjectIn, repo: Repo = Depends(get_repo)):
    updated = await repo.update_project(_uuid(project_id), body.to_row())
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found.")
    return updated


@admin.delete("/projects/{project_id}", dependencies=[Depends(check_origin)])
async def delete_project(project_id: str, repo: Repo = Depends(get_repo)):
    if not await repo.delete_project(_uuid(project_id)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found.")
    return {"ok": True}


app.include_router(public)
app.include_router(admin)

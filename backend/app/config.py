"""Settings read from environment variables. Secrets never have defaults."""

import os
from dataclasses import dataclass, field


def _list(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    # Supabase. The secret key bypasses RLS, so it must only ever live on the server.
    supabase_url: str = field(default_factory=lambda: os.getenv("SUPABASE_URL", "").rstrip("/"))
    supabase_secret_key: str = field(default_factory=lambda: os.getenv("SUPABASE_SECRET_KEY", ""))
    supabase_publishable_key: str = field(default_factory=lambda: os.getenv("SUPABASE_PUBLISHABLE_KEY", ""))

    # Supabase user ids that may use the admin API.
    admin_user_ids: list[str] = field(default_factory=lambda: _list("ADMIN_USER_IDS"))

    # Origins allowed to POST to the API (CSRF defence). Example: https://tabish.vercel.app
    allowed_origins: list[str] = field(default_factory=lambda: _list("ALLOWED_ORIGINS"))

    # Cloudflare Turnstile. When empty, the CAPTCHA check is skipped (local development only).
    turnstile_secret: str = field(default_factory=lambda: os.getenv("TURNSTILE_SECRET_KEY", ""))

    # Password Vercel Cron sends as "Authorization: Bearer <secret>" to /api/keepalive.
    cron_secret: str = field(default_factory=lambda: os.getenv("CRON_SECRET", ""))

    # Salt for hashing visitor IPs, so raw IPs are never stored.
    ip_salt: str = field(default_factory=lambda: os.getenv("IP_HASH_SALT", ""))

    # Contact form rate limit: at most N messages per IP per window.
    rate_limit_count: int = field(default_factory=lambda: int(os.getenv("RATE_LIMIT_COUNT", "3")))
    rate_limit_minutes: int = field(default_factory=lambda: int(os.getenv("RATE_LIMIT_MINUTES", "15")))

    # "production" on Vercel. Anything else counts as local development.
    environment: str = field(default_factory=lambda: os.getenv("APP_ENV", os.getenv("VERCEL_ENV", "development")))

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def has_database(self) -> bool:
        return bool(self.supabase_url and self.supabase_secret_key)


def get_settings() -> Settings:
    return Settings()

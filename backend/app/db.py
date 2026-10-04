"""Data access. Production talks to Supabase over its REST API with the server-only
secret key. Local development and tests use an in-memory store."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Protocol

import httpx


class Repo(Protocol):
    async def list_projects(self, published_only: bool) -> list[dict]: ...
    async def create_project(self, row: dict) -> dict: ...
    async def update_project(self, project_id: str, row: dict) -> dict | None: ...
    async def delete_project(self, project_id: str) -> bool: ...
    async def insert_message(self, row: dict) -> None: ...
    async def count_recent_messages(self, ip_hash: str, since: datetime) -> int: ...
    async def list_messages(self, limit: int) -> list[dict]: ...
    async def update_message_status(self, message_id: str, status: str) -> bool: ...


class DatabaseError(RuntimeError):
    """Raised when Supabase returns an error. Details are logged, never sent to visitors."""


class SupabaseRepo:
    def __init__(self, url: str, secret_key: str, timeout: float = 8.0):
        self._base = f"{url}/rest/v1"
        # New-style secret keys go on the apikey header only (they are not JWTs).
        self._headers = {"apikey": secret_key, "Content-Type": "application/json"}
        self._timeout = timeout

    async def _request(self, method: str, table: str, *, params=None, json=None, prefer=None):
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.request(method, f"{self._base}/{table}", params=params, json=json, headers=headers)
        if resp.status_code >= 400:
            raise DatabaseError(f"supabase {method} {table} -> {resp.status_code}: {resp.text[:300]}")
        return resp

    async def list_projects(self, published_only: bool) -> list[dict]:
        params = {"select": "*", "order": "sort_order.asc,created_at.asc"}
        if published_only:
            params["is_published"] = "eq.true"
        return (await self._request("GET", "projects", params=params)).json()

    async def create_project(self, row: dict) -> dict:
        resp = await self._request("POST", "projects", json=row, prefer="return=representation")
        return resp.json()[0]

    async def update_project(self, project_id: str, row: dict) -> dict | None:
        resp = await self._request("PATCH", "projects", params={"id": f"eq.{project_id}"}, json=row,
                                   prefer="return=representation")
        data = resp.json()
        return data[0] if data else None

    async def delete_project(self, project_id: str) -> bool:
        resp = await self._request("DELETE", "projects", params={"id": f"eq.{project_id}"},
                                   prefer="return=representation")
        return bool(resp.json())

    async def insert_message(self, row: dict) -> None:
        await self._request("POST", "messages", json=row, prefer="return=minimal")

    async def count_recent_messages(self, ip_hash: str, since: datetime) -> int:
        resp = await self._request(
            "HEAD", "messages",
            params={"select": "id", "ip_hash": f"eq.{ip_hash}", "created_at": f"gte.{since.isoformat()}"},
            prefer="count=exact",
        )
        content_range = resp.headers.get("content-range", "*/0")
        total = content_range.split("/")[-1]
        return int(total) if total.isdigit() else 0

    async def list_messages(self, limit: int) -> list[dict]:
        params = {"select": "id,name,email,message,status,created_at", "order": "created_at.desc",
                  "limit": str(limit)}
        return (await self._request("GET", "messages", params=params)).json()

    async def update_message_status(self, message_id: str, status: str) -> bool:
        resp = await self._request("PATCH", "messages", params={"id": f"eq.{message_id}"},
                                   json={"status": status}, prefer="return=representation")
        return bool(resp.json())


class MemoryRepo:
    """Local development and tests only. Data disappears when the process stops."""

    def __init__(self, seed_projects: list[dict] | None = None):
        self.projects: list[dict] = []
        self.messages: list[dict] = []
        for i, p in enumerate(seed_projects or []):
            self.projects.append({**p, "id": str(uuid.uuid4()), "sort_order": p.get("sort_order", i),
                                  "created_at": datetime.now(timezone.utc).isoformat()})

    async def list_projects(self, published_only: bool) -> list[dict]:
        items = [p for p in self.projects if p.get("is_published", True) or not published_only]
        return sorted(items, key=lambda p: p["sort_order"])

    async def create_project(self, row: dict) -> dict:
        item = {**row, "id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}
        self.projects.append(item)
        return item

    async def update_project(self, project_id: str, row: dict) -> dict | None:
        for p in self.projects:
            if p["id"] == project_id:
                p.update(row)
                return p
        return None

    async def delete_project(self, project_id: str) -> bool:
        before = len(self.projects)
        self.projects = [p for p in self.projects if p["id"] != project_id]
        return len(self.projects) < before

    async def insert_message(self, row: dict) -> None:
        self.messages.append({**row, "id": str(uuid.uuid4()), "status": "new",
                              "created_at": datetime.now(timezone.utc).isoformat()})

    async def count_recent_messages(self, ip_hash: str, since: datetime) -> int:
        return sum(1 for m in self.messages
                   if m["ip_hash"] == ip_hash and datetime.fromisoformat(m["created_at"]) >= since)

    async def list_messages(self, limit: int) -> list[dict]:
        return sorted(self.messages, key=lambda m: m["created_at"], reverse=True)[:limit]

    async def update_message_status(self, message_id: str, status: str) -> bool:
        for m in self.messages:
            if m["id"] == message_id:
                m["status"] = status
                return True
        return False


DEFAULT_PROJECTS = [
    {"title": "Sky Computers & Robotics",
     "description": "Website and product catalogue for a tech store, with an admin panel to add products and manage enquiries.",
     "tags": ["Next.js", "Supabase", "Tailwind"], "live_url": None,
     "code_url": "https://github.com/Hamza313-cyber/sky-computer-and-robotics", "status": "live", "is_published": True},
    {"title": "PulseWise", "description": "Medical calculator app with 19 calculators. Installs on a phone like an app.",
     "tags": ["React", "PWA"], "live_url": "https://medical-calculator-topaz.vercel.app",
     "code_url": "https://github.com/Hamza313-cyber/Calculator-", "status": "live", "is_published": True},
    {"title": "AEOS", "description": "AI operating-system dashboard for organising content and work.",
     "tags": ["TypeScript", "Vite"], "live_url": "https://aeos-six.vercel.app",
     "code_url": "https://github.com/Hamza313-cyber/AEOS", "status": "live", "is_published": True},
    {"title": "CryptoTrack", "description": "Crypto price tracker with live market data.",
     "tags": ["React", "Supabase"], "live_url": None, "code_url": None, "status": "in_progress", "is_published": True},
]

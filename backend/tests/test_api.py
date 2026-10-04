"""API tests. They run against the in-memory store, with no network access."""

import pytest
from fastapi.testclient import TestClient

from app import main as api
from app.config import Settings, get_settings
from app.db import DEFAULT_PROJECTS, MemoryRepo

ORIGIN = "https://tabish.example"
GOOD = {"name": "Ayesha", "email": "ayesha@example.com", "message": "I need an n8n workflow for my orders."}


def make_client(**overrides) -> tuple[TestClient, MemoryRepo]:
    repo = MemoryRepo(DEFAULT_PROJECTS)
    base = dict(supabase_url="", supabase_secret_key="", supabase_publishable_key="",
                admin_user_ids=[], allowed_origins=[ORIGIN], turnstile_secret="", ip_salt="test-salt",
                rate_limit_count=3, rate_limit_minutes=15, environment="development")
    base.update(overrides)
    settings = Settings(**base)
    api.app.dependency_overrides[get_settings] = lambda: settings
    api.app.dependency_overrides[api.get_repo] = lambda: repo
    return TestClient(api.app), repo


@pytest.fixture(autouse=True)
def _reset():
    yield
    api.app.dependency_overrides.clear()


def post_contact(client, body=None, origin=ORIGIN, ip="1.2.3.4"):
    return client.post("/api/contact", json=body or GOOD, headers={"origin": origin, "x-real-ip": ip})


def test_health_and_security_headers():
    client, _ = make_client()
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"


def test_projects_public_list_hides_unpublished():
    client, repo = make_client()
    repo.projects[0]["is_published"] = False
    r = client.get("/api/projects")
    assert r.status_code == 200
    assert len(r.json()) == len(DEFAULT_PROJECTS) - 1
    assert "s-maxage" in r.headers["cache-control"]


def test_contact_saves_message_and_hashes_ip():
    client, repo = make_client()
    r = post_contact(client)
    assert r.status_code == 201
    saved = repo.messages[0]
    assert saved["email"] == "ayesha@example.com"
    assert saved["ip_hash"] != "1.2.3.4" and len(saved["ip_hash"]) == 64


def test_contact_rejects_wrong_origin():
    client, repo = make_client()
    assert post_contact(client, origin="https://evil.example").status_code == 403
    assert repo.messages == []


def test_contact_rejects_honeypot():
    client, repo = make_client()
    assert post_contact(client, body={**GOOD, "website": "http://spam"}).status_code == 400
    assert repo.messages == []


def test_contact_validation_does_not_echo_input():
    client, _ = make_client()
    r = post_contact(client, body={**GOOD, "email": "not-an-email<script>"})
    assert r.status_code == 422
    assert "<script>" not in r.text


def test_contact_rejects_unknown_fields():
    client, _ = make_client()
    assert post_contact(client, body={**GOOD, "is_admin": True}).status_code == 422


def test_contact_rate_limit():
    client, _ = make_client(rate_limit_count=2)
    assert post_contact(client).status_code == 201
    assert post_contact(client).status_code == 201
    assert post_contact(client).status_code == 429
    assert post_contact(client, ip="5.6.7.8").status_code == 201  # other visitors unaffected


def test_oversized_body_rejected():
    client, _ = make_client()
    r = client.post("/api/contact", content=b"x" * 30_000,
                    headers={"origin": ORIGIN, "content-type": "application/json"})
    assert r.status_code == 413


def test_production_fails_closed_without_config():
    client, repo = make_client(environment="production", allowed_origins=[])
    assert post_contact(client).status_code == 403          # no ALLOWED_ORIGINS
    client, repo = make_client(environment="production")
    assert post_contact(client).status_code == 400          # no Turnstile secret
    assert repo.messages == []


def test_admin_requires_login():
    client, _ = make_client()
    assert client.get("/api/admin/messages").status_code == 401
    assert client.get("/api/admin/messages", headers={"authorization": "Bearer wrong"}).status_code == 401


def test_dev_admin_token_refused_in_production():
    client, _ = make_client(environment="production")
    r = client.get("/api/admin/messages", headers={"authorization": "Bearer dev-admin"})
    assert r.status_code == 401


def test_admin_project_crud_and_message_status():
    client, repo = make_client()
    h = {"authorization": "Bearer dev-admin", "origin": ORIGIN}
    post_contact(client)
    msgs = client.get("/api/admin/messages", headers=h).json()
    assert msgs[0]["name"] == "Ayesha"
    assert client.patch(f"/api/admin/messages/{msgs[0]['id']}", json={"status": "read"}, headers=h).status_code == 200

    new = {"title": "Excel Report Bot", "description": "Daily sales report built automatically.",
           "tags": ["n8n", "Excel"], "status": "in_progress"}
    created = client.post("/api/admin/projects", json=new, headers=h)
    assert created.status_code == 201
    pid = created.json()["id"]
    upd = client.put(f"/api/admin/projects/{pid}", json={**new, "status": "live"}, headers=h)
    assert upd.json()["status"] == "live"
    assert client.delete(f"/api/admin/projects/{pid}", headers=h).status_code == 200
    assert client.delete("/api/admin/projects/not-a-uuid", headers=h).status_code == 404


def test_admin_rejects_bad_project_urls():
    client, _ = make_client()
    h = {"authorization": "Bearer dev-admin", "origin": ORIGIN}
    bad = {"title": "X project", "description": "Something here.", "live_url": "javascript:alert(1)"}
    assert client.post("/api/admin/projects", json=bad, headers=h).status_code == 422

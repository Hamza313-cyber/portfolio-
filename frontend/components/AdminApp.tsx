"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/projects";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const DEV_MODE = !SB_URL && process.env.NODE_ENV === "development";

type Message = { id: string; name: string; email: string; message: string; status: "new" | "read" | "archived"; created_at: string };
type Tab = "messages" | "projects";

export default function AdminApp() {
  const supabase: SupabaseClient | null = useMemo(
    () => (SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null), [],
  );
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("messages");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setToken(session?.access_token ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setToken(null);
  }, [supabase]);

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const res = await fetch(`/api/admin${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
    });
    if (res.status === 401) { await logout(); throw new Error("Your session has expired. Please log in again."); }
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.detail ?? "Something went wrong. Try again.");
    return payload;
  }, [token, logout]);

  if (!token) return <Login supabase={supabase} onDevLogin={() => setToken("dev-admin")} />;

  return (
    <main className="wrap admin">
      <div className="admin-top">
        <h2>Admin</h2>
        <div className="tabs" role="group" aria-label="Sections">
          <button className="btn ghost sm" aria-pressed={tab === "messages"} onClick={() => setTab("messages")}>Messages</button>
          <button className="btn ghost sm" aria-pressed={tab === "projects"} onClick={() => setTab("projects")}>Projects</button>
          <button className="btn ghost sm" onClick={logout}>Log out</button>
        </div>
      </div>
      {tab === "messages" ? <Messages api={api} /> : <ProjectsAdmin api={api} />}
    </main>
  );
}

type Api = (path: string, init?: RequestInit) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function Login({ supabase, onDevLogin }: { supabase: SupabaseClient | null; onDevLogin: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    const data = new FormData(e.currentTarget);
    setBusy(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({
      email: String(data.get("email") ?? ""), password: String(data.get("password") ?? ""),
    });
    setBusy(false);
    if (err) setError("Email or password is incorrect.");
  }

  return (
    <main className="wrap admin">
      <h2>Admin login</h2>
      {supabase ? (
        <form className="form" onSubmit={onSubmit}>
          <div className="field"><label htmlFor="ad-email">Email</label><input id="ad-email" name="email" type="email" autoComplete="username" required /></div>
          <div className="field"><label htmlFor="ad-pass">Password</label><input id="ad-pass" name="password" type="password" autoComplete="current-password" required /></div>
          {error && <p className="notice err" role="alert">{error}</p>}
          <div><button className="btn solid" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button></div>
        </form>
      ) : DEV_MODE ? (
        <div className="form">
          <p className="lead muted">Supabase is not connected. This local test login works only on your computer.</p>
          <div><button className="btn solid" onClick={onDevLogin}>Open test admin</button></div>
        </div>
      ) : (
        <p className="notice err">Login is not set up yet.</p>
      )}
    </main>
  );
}

function Messages({ api }: { api: Api }) {
  const [items, setItems] = useState<Message[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api("/messages").then(setItems).catch((e) => setError(e.message));
  }, [api]);
  useEffect(load, [load]);

  async function setStatus(id: string, status: Message["status"]) {
    try { await api(`/messages/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); load(); }
    catch (e) { setError((e as Error).message); }
  }

  if (error) return <p className="notice err" role="alert">{error}</p>;
  if (!items) return <p className="lead muted">Loading messages…</p>;
  if (!items.length) return <p className="lead muted">No messages yet. When someone uses the contact form, it shows up here.</p>;

  return (
    <div className="list">
      {items.map((m) => (
        <article className="item" key={m.id}>
          <div className="meta">
            <span className={`pill ${m.status}`}>{m.status}</span>
            <strong>{m.name}</strong>
            <span>{m.email}</span>
            <span>{new Date(m.created_at).toLocaleString()}</span>
          </div>
          <p className="body">{m.message}</p>
          <div className="actions">
            {m.status !== "read" && <button className="btn ghost sm" onClick={() => setStatus(m.id, "read")}>Mark read</button>}
            {m.status !== "archived" && <button className="btn ghost sm" onClick={() => setStatus(m.id, "archived")}>Archive</button>}
            {m.status !== "new" && <button className="btn ghost sm" onClick={() => setStatus(m.id, "new")}>Mark new</button>}
          </div>
        </article>
      ))}
    </div>
  );
}

function ProjectsAdmin({ api }: { api: Api }) {
  const [items, setItems] = useState<Project[] | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    api("/projects").then(setItems).catch((e) => setNotice({ ok: false, text: e.message }));
  }, [api]);
  useEffect(load, [load]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = {
      title: String(d.get("title") ?? "").trim(),
      description: String(d.get("description") ?? "").trim(),
      tags: String(d.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      live_url: String(d.get("live_url") ?? "").trim() || null,
      code_url: String(d.get("code_url") ?? "").trim() || null,
      status: String(d.get("status")),
      sort_order: Number(d.get("sort_order") ?? 0),
      is_published: d.get("is_published") === "on",
    };
    try {
      if (editing) await api(`/projects/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/projects", { method: "POST", body: JSON.stringify(body) });
      setNotice({ ok: true, text: editing ? "Project updated." : "Project added." });
      setEditing(null);
      (e.target as HTMLFormElement).reset();
      load();
    } catch (err) {
      setNotice({ ok: false, text: (err as Error).message });
    }
  }

  async function remove(id: string) {
    try { await api(`/projects/${id}`, { method: "DELETE" }); setConfirmId(null); setNotice({ ok: true, text: "Project deleted." }); load(); }
    catch (err) { setNotice({ ok: false, text: (err as Error).message }); }
  }

  return (
    <div className="list">
      {notice && <p className={`notice ${notice.ok ? "ok" : "err"}`} role="status">{notice.text}</p>}

      {/* key resets the uncontrolled inputs when switching between projects */}
      <form className="form" onSubmit={save} key={editing?.id ?? "new"}>
        <h3>{editing ? `Edit: ${editing.title}` : "Add a project"}</h3>
        <div className="field"><label htmlFor="pj-title">Title</label><input id="pj-title" name="title" defaultValue={editing?.title} maxLength={120} required /></div>
        <div className="field"><label htmlFor="pj-desc">Description</label><textarea id="pj-desc" name="description" defaultValue={editing?.description} maxLength={600} required /></div>
        <div className="field"><label htmlFor="pj-tags">Tags (comma separated)</label><input id="pj-tags" name="tags" defaultValue={editing?.tags.join(", ")} /></div>
        <div className="field"><label htmlFor="pj-live">Live link</label><input id="pj-live" name="live_url" type="url" defaultValue={editing?.live_url ?? ""} placeholder="https://" /></div>
        <div className="field"><label htmlFor="pj-code">Code link</label><input id="pj-code" name="code_url" type="url" defaultValue={editing?.code_url ?? ""} placeholder="https://github.com/…" /></div>
        <div className="field"><label htmlFor="pj-status">Status</label>
          <select id="pj-status" name="status" defaultValue={editing?.status ?? "live"}>
            <option value="live">Live</option><option value="in_progress">In progress</option>
          </select>
        </div>
        <div className="field"><label htmlFor="pj-order">Order (0 shows first)</label><input id="pj-order" name="sort_order" type="number" min={0} max={1000} defaultValue={editing?.sort_order ?? 0} /></div>
        <label className="check"><input name="is_published" type="checkbox" defaultChecked={editing?.is_published ?? true} /> Show on the website</label>
        <div className="actions">
          <button className="btn solid">{editing ? "Save changes" : "Add project"}</button>
          {editing && <button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>}
        </div>
      </form>

      {!items ? <p className="lead muted">Loading projects…</p> : items.map((p) => (
        <article className="item" key={p.id}>
          <div className="meta">
            <strong>{p.title}</strong>
            <span className="pill">{p.status === "live" ? "Live" : "In progress"}</span>
            {!p.is_published && <span className="pill">Hidden</span>}
          </div>
          <p className="body">{p.description}</p>
          <div className="actions">
            <button className="btn ghost sm" onClick={() => setEditing(p)}>Edit</button>
            {confirmId === p.id ? (
              <>
                <button className="btn solid sm" onClick={() => remove(p.id)}>Yes, delete</button>
                <button className="btn ghost sm" onClick={() => setConfirmId(null)}>Keep</button>
              </>
            ) : (
              <button className="btn ghost sm" onClick={() => setConfirmId(p.id)}>Delete</button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

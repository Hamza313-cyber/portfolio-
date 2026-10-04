"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
};
declare global {
  interface Window { turnstile?: Turnstile }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "ok" } | { kind: "err"; text: string };

export default function ContactForm({ nonce }: { nonce?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [token, setToken] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  const renderWidget = useCallback(() => {
    if (!SITE_KEY || !window.turnstile || !boxRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(boxRef.current, {
      sitekey: SITE_KEY,
      theme: "dark",
      callback: (t: string) => setToken(t),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  }, []);

  useEffect(() => { renderWidget(); }, [renderWidget]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const body = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      website: String(data.get("website") ?? ""),
      turnstile_token: token,
    };
    if (body.name.length < 2) return setState({ kind: "err", text: "Please enter your name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return setState({ kind: "err", text: "Please enter a valid email address." });
    if (body.message.length < 10) return setState({ kind: "err", text: "Please write at least 10 characters in your message." });
    if (SITE_KEY && !token) return setState({ kind: "err", text: "Please complete the security check." });

    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        form.reset();
        setState({ kind: "ok" });
      } else {
        const payload = await res.json().catch(() => ({}));
        setState({ kind: "err", text: payload.detail ?? "Your message could not be sent. Please try again." });
      }
    } catch {
      setState({ kind: "err", text: "Network problem. Check your connection and try again." });
    } finally {
      setToken("");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          nonce={nonce}
          onLoad={renderWidget}
        />
      )}
      <div className="field">
        <label htmlFor="cf-name">Name</label>
        <input id="cf-name" name="name" autoComplete="name" maxLength={100} required />
      </div>
      <div className="field">
        <label htmlFor="cf-email">Email</label>
        <input id="cf-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      </div>
      <div className="field">
        <label htmlFor="cf-message">Message</label>
        <textarea id="cf-message" name="message" maxLength={5000} required />
        <span className="hint">What do you want to automate or build?</span>
      </div>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="cf-website">Leave this empty</label>
        <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {SITE_KEY && <div ref={boxRef} />}
      {state.kind === "ok" && <p className="notice ok" role="status">Message sent. I will reply to your email soon.</p>}
      {state.kind === "err" && <p className="notice err" role="alert">{state.text}</p>}
      <div>
        <button className="btn solid" type="submit" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

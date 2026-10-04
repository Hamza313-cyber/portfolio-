# Tabish Ali Khan — Portfolio

Personal portfolio with a working contact form and a private admin panel.

| Part | Folder | Language |
|---|---|---|
| Website | `frontend/` | TypeScript (Next.js 16, React 19, Tailwind CSS 4) |
| API | `backend/` | Python (FastAPI) |
| Database | `supabase/schema.sql` | SQL (Supabase Postgres) |

Both parts deploy as one Vercel project using [Vercel Services](https://vercel.com/docs/services) (beta):
`/api/*` goes to the Python service, everything else to Next.js. See `vercel.json`.

## Features

- Sunset wallpaper, typewriter animation, self-hosted fonts (Cinzel, DM Sans, Great Vibes)
- Projects list served by the API, with a built-in fallback if the API is down
- Contact form saved to the database
- `/admin`: log in with Supabase Auth, read messages, add / edit / hide / delete projects

## Security

- **Input validation** on the server with Pydantic: types, lengths, no unknown fields, http(s) links only
- **Bot protection**: Cloudflare Turnstile CAPTCHA and a hidden honeypot field
- **Rate limit**: 3 messages per visitor per 15 minutes (configurable); IPs are stored only as a keyed hash
- **CSRF**: write requests must come from an allowed `Origin`; the admin API uses bearer tokens, not cookies
- **Admin access**: token checked with Supabase Auth, then the user id must be in `ADMIN_USER_IDS`
- **Database**: Row Level Security on every table; published projects can be read publicly, while messages and admin writes stay server-only
- **Headers**: per-request nonce Content-Security-Policy (`frontend/proxy.ts`), HSTS, `X-Frame-Options: DENY`, `nosniff`, strict referrer and permissions policies
- **Fails closed**: in production, a missing CAPTCHA key, allowed-origin list or database config blocks requests instead of letting them through
- API docs are disabled in production; error messages never echo user input or database details

No website is impossible to hack. Keep dependencies updated (enable Dependabot) and never commit `.env` files.

## Run locally

```bash
# API (in-memory data, no Supabase needed)
cd backend
pip install -e ".[dev]"
ALLOWED_ORIGINS=http://localhost:3000 uvicorn main:app --port 8000

# Website (in another terminal)
cd frontend
npm install
npm run dev        # http://localhost:3000, /api is proxied to port 8000
```

Locally, `/admin` shows an "Open test admin" button that works only in development.

Tests: `cd backend && pytest`

## Deploy

1. **Supabase**: create a project, run `supabase/schema.sql` in the SQL Editor, turn off public sign-ups
   (Authentication → Sign In / Providers), and create your admin user. Copy its user id. Add a read policy
   that allows `anon` and `authenticated` users to select only rows where `projects.is_published = true`.
2. **Cloudflare Turnstile**: create a widget for your domain and copy the site key and secret key.
3. **Vercel**: import this repository, then add the variables from `.env.example`. Use
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for the public Turnstile site key and `TURNSTILE_SECRET_KEY` for the
   server-only secret key.
4. Deploy, open the site, send a test message, and check it appears in `/admin`.

**Keep-alive**: Supabase free projects pause after a week of low activity. `vercel.json` schedules a daily
Vercel Cron call to `/api/keepalive` (09:00 IST give or take an hour on the Hobby plan), which reads one row
from the database. Set `CRON_SECRET` in Vercel; requests without it are refused.

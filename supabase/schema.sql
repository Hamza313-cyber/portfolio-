-- Tabish portfolio database. Run once in the Supabase SQL Editor.
--
-- Security model: Row Level Security is ON for every table and there are NO
-- policies for the anon or authenticated roles. That means the browser can never
-- read or write these tables directly, even with the public key. Only the Python
-- backend, which holds the server-only secret key, can reach them.

create extension if not exists pgcrypto;

-- ---------- projects ----------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 2 and 120),
  description  text not null check (char_length(description) between 5 and 600),
  tags         text[] not null default '{}' check (cardinality(tags) <= 8),
  live_url     text check (live_url is null or live_url ~ '^https?://'),
  code_url     text check (code_url is null or code_url ~ '^https?://'),
  status       text not null default 'live' check (status in ('live', 'in_progress')),
  sort_order   integer not null default 0 check (sort_order between 0 and 1000),
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists projects_order_idx on public.projects (is_published, sort_order);

-- ---------- messages (contact form) ----------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 100),
  email       text not null check (char_length(email) between 3 and 254 and email like '%@%'),
  message     text not null check (char_length(message) between 10 and 5000),
  ip_hash     text not null check (char_length(ip_hash) = 64),   -- keyed hash, never the raw IP
  user_agent  text not null default '' check (char_length(user_agent) <= 300),
  status      text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at  timestamptz not null default now()
);

-- Powers the rate limit (messages per visitor in the last N minutes) and the inbox.
create index if not exists messages_ip_time_idx on public.messages (ip_hash, created_at desc);
create index if not exists messages_time_idx on public.messages (created_at desc);

-- ---------- keep updated_at current ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ---------- lock down ----------
alter table public.projects enable row level security;
alter table public.messages enable row level security;
alter table public.projects force row level security;
alter table public.messages force row level security;

revoke all on public.projects from anon, authenticated;
revoke all on public.messages from anon, authenticated;

-- ---------- starting projects ----------
insert into public.projects (title, description, tags, live_url, code_url, status, sort_order)
select * from (values
  ('Sky Computers & Robotics',
   'Website and product catalogue for a tech store, with an admin panel to add products and manage enquiries.',
   array['Next.js','Supabase','Tailwind'], null,
   'https://github.com/Hamza313-cyber/sky-computer-and-robotics', 'live', 0),
  ('PulseWise', 'Medical calculator app with 19 calculators. Installs on a phone like an app.',
   array['React','PWA'], 'https://medical-calculator-topaz.vercel.app',
   'https://github.com/Hamza313-cyber/Calculator-', 'live', 1),
  ('AEOS', 'AI operating-system dashboard for organising content and work.',
   array['TypeScript','Vite'], 'https://aeos-six.vercel.app',
   'https://github.com/Hamza313-cyber/AEOS', 'live', 2),
  ('CryptoTrack', 'Crypto price tracker with live market data.',
   array['React','Supabase'], null, null, 'in_progress', 3)
) as seed(title, description, tags, live_url, code_url, status, sort_order)
where not exists (select 1 from public.projects);

-- ---------- checks to run after this script ----------
-- select relname, relrowsecurity, relforcerowsecurity from pg_class
--   where relname in ('projects', 'messages');          -- both columns must be true
-- select count(*) from public.projects;                 -- 4

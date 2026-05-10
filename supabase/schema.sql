-- SpendLens — Supabase schema migration.
-- Apply via the Supabase SQL editor or `supabase db push`. Idempotent (uses IF NOT EXISTS).

-- audits: the canonical record. Public reads via RLS for /r/[id].
create table if not exists audits (
  id           text primary key,
  input        jsonb not null,
  result       jsonb not null,
  summary      text,
  created_at   timestamptz not null default now()
);

create index if not exists audits_created_at_idx on audits(created_at desc);

-- leads: identifying info. Never readable by anon role.
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  audit_id      text references audits(id) on delete cascade,
  email         text not null,
  company       text,
  role          text,
  team_size     int,
  ip_hash       text,
  created_at    timestamptz not null default now()
);

create index if not exists leads_audit_id_idx on leads(audit_id);
create index if not exists leads_email_idx on leads(email);

-- Enable Row Level Security
alter table audits enable row level security;
alter table leads  enable row level security;

-- audits: anon can SELECT (so /r/[id] works without a session).
-- Inserts are server-only via service role, which bypasses RLS.
drop policy if exists "anon can read audits" on audits;
create policy "anon can read audits"
  on audits for select
  to anon
  using (true);

-- leads: no anon read or write. Service role bypasses RLS for inserts.
drop policy if exists "no anon access to leads" on leads;
create policy "no anon access to leads"
  on leads for select
  to anon
  using (false);

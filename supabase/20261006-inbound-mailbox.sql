-- Catch-all mailbox ingestion (Phase 2). Run manually in the Supabase SQL editor. Idempotent.

alter table public.incoming_emails
  add column if not exists gmail_message_id text,
  add column if not exists gmail_thread_id text,
  add column if not exists to_candidates jsonb,
  add column if not exists body_text text,
  add column if not exists attachments jsonb,
  add column if not exists auth_results text,
  add column if not exists status text not null default 'received',
  add column if not exists error text;

create unique index if not exists incoming_emails_gmail_message_id_key
  on public.incoming_emails (gmail_message_id);

-- Single-row cursor for the catch-all mailbox (Gmail history id + watch expiry).
create table if not exists public.inbound_mailbox_state (
  id integer primary key default 1 check (id = 1),
  history_id text,
  watch_expiration timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.inbound_mailbox_state (id) values (1) on conflict (id) do nothing;

-- Mail we could not attribute to a broker. Never dropped; reviewed manually.
create table if not exists public.inbound_unmatched (
  id uuid primary key default gen_random_uuid(),
  gmail_message_id text not null unique,
  from_address text,
  subject text,
  to_candidates jsonb,
  received_at timestamptz,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Service-role only: RLS on with no policies.
alter table public.inbound_mailbox_state enable row level security;
alter table public.inbound_unmatched enable row level security;

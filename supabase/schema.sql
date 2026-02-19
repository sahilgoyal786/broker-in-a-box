-- ============================================================
-- Broker in a Box — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Enums ──────────────────────────────────────────────────

create type property_type as enum (
  'residential',
  'vacant_land',
  'mobile_home',
  'commercial',
  'multi_unit',
  'farm',
  'residential_lease'
);

create type transaction_type as enum (
  'listing',
  'buyer_agency',
  'seller_purchase',
  'buyer_purchase',
  'unrepresented_buyer',
  'fsbo_purchase'
);

create type tracking_type as enum (
  'pdf_auto',
  'manual_checkbox',
  'manual_upload',
  'inherited',
  'optional_any'
);

create type transaction_status as enum (
  'active',
  'under_contract',
  'closed',
  'cancelled'
);

create type received_via as enum (
  'gmail_watch',
  'email_submission',
  'manual_upload'
);

-- ── brokers ────────────────────────────────────────────────

create table brokers (
  id                        uuid primary key default uuid_generate_v4(),
  -- Links to auth.users
  auth_user_id              uuid unique references auth.users(id) on delete cascade,
  name                      text not null,
  email                     text not null unique,
  google_drive_folder_id    text,
  google_calendar_id        text,
  gmail_transactions_email  text,
  -- Encrypted tokens stored server-side only
  gmail_refresh_token       text,
  drive_refresh_token       text,
  calendar_refresh_token    text,
  -- Inbound email fallback address
  submission_address        text unique,
  created_at                timestamptz not null default now()
);

alter table brokers enable row level security;

create policy "Brokers can view own record"
  on brokers for select
  using (auth.uid() = auth_user_id);

create policy "Brokers can update own record"
  on brokers for update
  using (auth.uid() = auth_user_id);

create policy "Brokers can insert own record"
  on brokers for insert
  with check (auth.uid() = auth_user_id);

-- ── agents ─────────────────────────────────────────────────

create table agents (
  id             uuid primary key default uuid_generate_v4(),
  broker_id      uuid not null references brokers(id) on delete cascade,
  first_name     text not null,
  last_name      text not null,
  email          text not null,
  license_number text,
  created_at     timestamptz not null default now(),
  unique(broker_id, email)
);

alter table agents enable row level security;

create policy "Brokers can manage own agents"
  on agents for all
  using (
    broker_id in (
      select id from brokers where auth_user_id = auth.uid()
    )
  );

-- ── compliance_templates ───────────────────────────────────

create table compliance_templates (
  id               uuid primary key default uuid_generate_v4(),
  broker_id        uuid references brokers(id) on delete cascade,  -- NULL = system default
  property_type    property_type not null,
  transaction_type transaction_type not null,
  is_custom        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(broker_id, property_type, transaction_type)
);

alter table compliance_templates enable row level security;

-- Brokers can see system defaults (broker_id IS NULL) and their own templates
create policy "Read system defaults and own templates"
  on compliance_templates for select
  using (
    broker_id is null
    or broker_id in (
      select id from brokers where auth_user_id = auth.uid()
    )
  );

create policy "Brokers can manage own templates"
  on compliance_templates for all
  using (
    broker_id in (
      select id from brokers where auth_user_id = auth.uid()
    )
  )
  with check (
    broker_id in (
      select id from brokers where auth_user_id = auth.uid()
    )
  );

-- ── template_forms ─────────────────────────────────────────

create table template_forms (
  id            uuid primary key default uuid_generate_v4(),
  template_id   uuid not null references compliance_templates(id) on delete cascade,
  form_name     text not null,
  form_identifier text not null,
  tracking_type tracking_type not null default 'pdf_auto',
  sort_order    integer not null default 0,
  is_required   boolean not null default true,
  official_name text,
  uar_form      text,
  notes         text
);

alter table template_forms enable row level security;

-- Forms are readable if the parent template is readable
create policy "Read template forms via template access"
  on template_forms for select
  using (
    template_id in (
      select id from compliance_templates
      where broker_id is null
         or broker_id in (
           select id from brokers where auth_user_id = auth.uid()
         )
    )
  );

create policy "Brokers can manage forms on own templates"
  on template_forms for all
  using (
    template_id in (
      select id from compliance_templates
      where broker_id in (
        select id from brokers where auth_user_id = auth.uid()
      )
    )
  );

-- ── transactions ───────────────────────────────────────────

create table transactions (
  id               uuid primary key default uuid_generate_v4(),
  broker_id        uuid not null references brokers(id) on delete cascade,
  agent_id         uuid references agents(id) on delete set null,
  property_type    property_type not null,
  transaction_type transaction_type not null,
  client_last_name  text not null,
  client_first_name text not null,
  property_address text,  -- nullable: buyer rep before offer
  status           transaction_status not null default 'active',
  drive_folder_id  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Brokers can manage own transactions"
  on transactions for all
  using (
    broker_id in (
      select id from brokers where auth_user_id = auth.uid()
    )
  )
  with check (
    broker_id in (
      select id from brokers where auth_user_id = auth.uid()
    )
  );

-- ── transaction_documents ──────────────────────────────────

create table transaction_documents (
  id                uuid primary key default uuid_generate_v4(),
  transaction_id    uuid not null references transactions(id) on delete cascade,
  form_identifier   text not null,
  form_name         text not null,
  original_filename text,
  drive_file_id     text,
  received_at       timestamptz not null default now(),
  received_via      received_via not null default 'manual_upload',
  ai_confidence     float check (ai_confidence >= 0 and ai_confidence <= 1),
  ai_identified_as  text,
  verified          boolean not null default false,
  signatures_verified boolean not null default false,
  created_at        timestamptz not null default now()
);

alter table transaction_documents enable row level security;

create policy "Brokers can manage documents on own transactions"
  on transaction_documents for all
  using (
    transaction_id in (
      select t.id from transactions t
      join brokers b on b.id = t.broker_id
      where b.auth_user_id = auth.uid()
    )
  );

-- ── transaction_deadlines ──────────────────────────────────

create table transaction_deadlines (
  id                      uuid primary key default uuid_generate_v4(),
  transaction_id          uuid not null references transactions(id) on delete cascade,
  label                   text not null,
  deadline_date           date not null,
  google_calendar_event_id text,
  created_at              timestamptz not null default now()
);

alter table transaction_deadlines enable row level security;

create policy "Brokers can manage deadlines on own transactions"
  on transaction_deadlines for all
  using (
    transaction_id in (
      select t.id from transactions t
      join brokers b on b.id = t.broker_id
      where b.auth_user_id = auth.uid()
    )
  );

-- ── incoming_emails ────────────────────────────────────────

create table incoming_emails (
  id               uuid primary key default uuid_generate_v4(),
  broker_id        uuid not null references brokers(id) on delete cascade,
  received_at      timestamptz not null default now(),
  from_address     text not null,
  subject          text not null,
  esign_platform   text,
  attachment_count integer not null default 0,
  processed        boolean not null default false,
  transaction_id   uuid references transactions(id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table incoming_emails enable row level security;

create policy "Brokers can manage own emails"
  on incoming_emails for all
  using (
    broker_id in (
      select id from brokers where auth_user_id = auth.uid()
    )
  );

-- ── updated_at trigger ─────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_compliance_templates_updated_at
  before update on compliance_templates
  for each row execute function update_updated_at();

create trigger trg_transactions_updated_at
  before update on transactions
  for each row execute function update_updated_at();

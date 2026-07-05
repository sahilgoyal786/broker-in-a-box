-- Broker in a Box recovery schema
-- Created July 3, 2026 for a fresh Supabase project.
--
-- This is a clean baseline distilled from the recovered source tree.
-- Do not run the old migration stack against a new project unless it has been
-- reviewed file by file.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'broker' check (role in ('broker', 'agent')),
  google_drive_folder_id text,
  google_calendar_id text,
  gmail_transactions_email text,
  gmail_refresh_token text,
  drive_refresh_token text,
  calendar_refresh_token text,
  submission_address text unique,
  file_id_prefix text,
  next_file_number integer not null default 1,
  notify_new_transaction boolean not null default true,
  notify_status_changes boolean not null default true,
  notify_deadline_reminders boolean not null default true,
  notify_agent_updates boolean not null default true,
  notification_preference text not null default 'exception_based' check (notification_preference in ('real_time', 'daily_digest', 'exception_based', 'dashboard_only')),
  deadline_reminder_days integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  role text not null default 'agent' check (role in ('broker', 'agent')),
  first_name text not null,
  middle_initial text,
  last_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  gender text,
  license_number text,
  license_expiration date,
  primary_board text,
  original_license_date date,
  current_company text,
  hire_date date,
  listings_at_hire integer not null default 0,
  payment_method text check (payment_method is null or payment_method in ('entity', 'person')),
  entity_name text,
  ssn_last_4 text,
  ein text,
  address text,
  city text,
  state text default 'UT',
  zip text,
  is_active boolean not null default true,
  invite_token text unique,
  invite_status text not null default 'not_invited' check (invite_status in ('not_invited', 'invited', 'active', 'expired')),
  invite_sent_at timestamptz,
  invite_accepted_at timestamptz,
  ce_due_date date,
  ce_completed_hours numeric(5,2) not null default 0,
  ce_required_hours numeric(5,2) not null default 18,
  ce_core_hours numeric(5,2) not null default 0,
  ce_elective_hours numeric(5,2) not null default 0,
  mandatory_course_completed boolean not null default false,
  nar_member boolean not null default false,
  nar_code_of_ethics_date date,
  nar_fair_housing_date date,
  nar_code_of_ethics_completed boolean not null default false,
  nar_fair_housing_completed boolean not null default false,
  nar_code_of_ethics_cert_url text,
  nar_fair_housing_cert_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (broker_id, email)
);

create table if not exists public.agency_agreements (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  file_id text unique,
  agreement_type text not null check (agreement_type in ('listing_agreement', 'buyer_agency_agreement')),
  client_first_name text not null,
  client_last_name text not null,
  client_email text,
  client_phone text,
  property_address text,
  property_city text,
  property_state text default 'UT',
  property_zip text,
  county text,
  property_type text check (property_type is null or property_type in ('residential', 'vacant_land', 'mobile_home', 'commercial', 'multi_unit', 'farm', 'residential_lease')),
  tax_id text,
  mls_number text,
  purpose text default 'purchase' check (purpose in ('purchase', 'lease')),
  list_price numeric(12,2),
  agreement_date date not null,
  expiration_date date,
  status text not null default 'active' check (status in ('active', 'expired', 'terminated', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_compliance_items (
  id uuid primary key default gen_random_uuid(),
  agency_agreement_id uuid not null references public.agency_agreements(id) on delete cascade,
  form_name text not null,
  tracking_type text not null default 'manual_checkbox' check (tracking_type in ('pdf_auto', 'manual_checkbox', 'manual_upload', 'inherited', 'optional_any')),
  is_required boolean not null default true,
  is_complete boolean not null default false,
  completed_at timestamptz,
  file_url text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  agency_agreement_id uuid references public.agency_agreements(id) on delete set null,
  property_address text not null,
  property_city text not null,
  property_state text default 'UT',
  property_zip text not null,
  county text,
  property_type text not null check (property_type in ('residential', 'vacant_land', 'mobile_home', 'commercial', 'multi_unit', 'farm', 'residential_lease')),
  tax_id text,
  original_list_price numeric(12,2),
  current_list_price numeric(12,2),
  listing_price numeric(12,2),
  sales_price numeric(12,2),
  mls_number text,
  listing_start_date date not null,
  listing_end_date date,
  commission_percentage numeric(5,2),
  commission_amount numeric(12,2),
  buyer_agent_commission_percentage numeric(5,2),
  buyer_agent_commission_amount numeric(12,2),
  seller_name text not null,
  seller_email text,
  seller_phone text,
  status text not null default 'active' check (status in ('active', 'pending', 'closed', 'expired', 'withdrawn', 'cancelled')),
  bedrooms integer,
  bathrooms numeric(3,1),
  square_feet integer,
  lot_size text,
  year_built integer,
  lot_size_land text,
  zoning text,
  number_of_units integer,
  total_bedrooms integer,
  total_bathrooms numeric(4,1),
  commercial_use text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_documents (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  document_type text not null,
  file_url text,
  uploaded_by uuid references public.agents(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  agency_agreement_id uuid references public.agency_agreements(id) on delete set null,
  file_id text unique,
  property_type text not null check (property_type in ('residential', 'vacant_land', 'mobile_home', 'commercial', 'multi_unit', 'farm', 'residential_lease')),
  transaction_type text not null check (transaction_type in ('listing', 'buyer_agency', 'limited_agency', 'seller_purchase', 'buyer_purchase', 'unrepresented_buyer', 'fsbo_purchase')),
  purpose text not null default 'purchase' check (purpose in ('purchase', 'lease')),
  client_first_name text,
  client_last_name text,
  buyer_first_name text,
  buyer_last_name text,
  buyer_email text,
  buyer_phone text,
  seller_first_name text,
  seller_last_name text,
  seller_email text,
  seller_phone text,
  property_address text,
  property_city text,
  property_state text default 'UT',
  property_zip text,
  county text,
  tax_id text,
  purchase_price numeric(12,2),
  contract_date date,
  offer_reference_date date,
  anticipated_closing_date date,
  actual_closing_date date,
  earnest_money_amount numeric(12,2),
  earnest_money_location text,
  earnest_money_held_by text,
  earnest_money_contact_name text,
  earnest_money_contact_email text,
  earnest_money_contact_phone text,
  seller_title_company text,
  seller_title_contact_name text,
  seller_title_contact_email text,
  seller_title_contact_phone text,
  buyer_title_company text,
  buyer_title_contact_name text,
  buyer_title_contact_email text,
  buyer_title_contact_phone text,
  cooperating_brokerage text,
  cooperating_agent_name text,
  cooperating_agent_phone text,
  cooperating_agent_email text,
  seller_disclosure_deadline date,
  due_diligence_deadline date,
  financing_appraisal_deadline date,
  settlement_deadline date,
  custom_deadline_1_label text,
  custom_deadline_1_date date,
  custom_deadline_2_label text,
  custom_deadline_2_date date,
  limited_agency_disclosure_signed boolean not null default false,
  drive_folder_id text,
  status text not null default 'pending' check (status in ('pending', 'active', 'under_contract', 'closed', 'cancelled', 'close_requested', 'cancel_requested')),
  close_requested_at timestamptz,
  close_requested_by uuid references public.agents(id) on delete set null,
  cancel_requested_at timestamptz,
  cancel_requested_by uuid references public.agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transaction_documents (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  form_identifier text,
  form_name text not null,
  original_filename text,
  drive_file_id text,
  received_at timestamptz not null default now(),
  received_via text not null default 'manual_upload' check (received_via in ('gmail_watch', 'email_submission', 'manual_upload')),
  ai_confidence numeric check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)),
  ai_identified_as text,
  verified boolean not null default false,
  signatures_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transaction_deadlines (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  label text not null,
  deadline_date date not null,
  google_calendar_event_id text,
  created_at timestamptz not null default now(),
  unique (transaction_id, label)
);

create table if not exists public.transaction_compliance_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  form_name text not null,
  tracking_type text not null default 'manual_checkbox' check (tracking_type in ('pdf_auto', 'manual_checkbox', 'manual_upload', 'inherited', 'optional_any')),
  is_required boolean not null default true,
  is_complete boolean not null default false,
  completed_at timestamptz,
  file_url text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incoming_emails (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  received_at timestamptz not null default now(),
  from_address text not null,
  subject text not null,
  esign_platform text,
  attachment_count integer not null default 0,
  processed boolean not null default false,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_agents_broker_id on public.agents(broker_id);
create index if not exists idx_agents_auth_user_id on public.agents(auth_user_id);
create index if not exists idx_agents_invite_token on public.agents(invite_token);
create index if not exists idx_agency_agreements_broker_id on public.agency_agreements(broker_id);
create index if not exists idx_agency_agreements_agent_id on public.agency_agreements(agent_id);
create index if not exists idx_agency_compliance_agreement_id on public.agency_compliance_items(agency_agreement_id);
create index if not exists idx_listings_broker_id on public.listings(broker_id);
create index if not exists idx_listings_agent_id on public.listings(agent_id);
create index if not exists idx_listings_agency_agreement_id on public.listings(agency_agreement_id);
create index if not exists idx_transactions_broker_id on public.transactions(broker_id);
create index if not exists idx_transactions_agent_id on public.transactions(agent_id);
create index if not exists idx_transactions_status on public.transactions(status);
create index if not exists idx_transaction_documents_transaction_id on public.transaction_documents(transaction_id);
create index if not exists idx_transaction_deadlines_transaction_id on public.transaction_deadlines(transaction_id);
create index if not exists idx_transaction_compliance_transaction_id on public.transaction_compliance_items(transaction_id);

create trigger brokers_set_updated_at
before update on public.brokers
for each row execute function public.set_updated_at();

create trigger agents_set_updated_at
before update on public.agents
for each row execute function public.set_updated_at();

create trigger agency_agreements_set_updated_at
before update on public.agency_agreements
for each row execute function public.set_updated_at();

create trigger agency_compliance_items_set_updated_at
before update on public.agency_compliance_items
for each row execute function public.set_updated_at();

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger transaction_compliance_items_set_updated_at
before update on public.transaction_compliance_items
for each row execute function public.set_updated_at();

create or replace function public.current_broker_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select b.id from public.brokers b where b.auth_user_id = auth.uid() limit 1),
    (select a.broker_id from public.agents a where a.auth_user_id = auth.uid() limit 1)
  )
$$;

create or replace function public.current_agent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select a.id from public.agents a where a.auth_user_id = auth.uid() limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.brokers b where b.auth_user_id = auth.uid()) then 'broker'
    when exists (select 1 from public.agents a where a.auth_user_id = auth.uid()) then 'agent'
    else null
  end
$$;

alter table public.brokers enable row level security;
alter table public.agents enable row level security;
alter table public.agency_agreements enable row level security;
alter table public.agency_compliance_items enable row level security;
alter table public.listings enable row level security;
alter table public.listing_documents enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_documents enable row level security;
alter table public.transaction_deadlines enable row level security;
alter table public.transaction_compliance_items enable row level security;
alter table public.incoming_emails enable row level security;

create policy "brokers read own broker record"
on public.brokers for select
using (auth_user_id = auth.uid());

create policy "brokers insert own broker record"
on public.brokers for insert
with check (auth_user_id = auth.uid());

create policy "brokers update own broker record"
on public.brokers for update
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy "users read brokerage agents"
on public.agents for select
using (
  broker_id = public.current_broker_id()
  or auth_user_id = auth.uid()
);

create policy "brokers insert agents"
on public.agents for insert
with check (broker_id = public.current_broker_id() and public.current_user_role() = 'broker');

create policy "brokers update agents"
on public.agents for update
using (broker_id = public.current_broker_id() and public.current_user_role() = 'broker')
with check (broker_id = public.current_broker_id());

create policy "agents update own profile"
on public.agents for update
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy "users read brokerage agency agreements"
on public.agency_agreements for select
using (broker_id = public.current_broker_id());

create policy "users insert brokerage agency agreements"
on public.agency_agreements for insert
with check (
  broker_id = public.current_broker_id()
  and (
    public.current_user_role() = 'broker'
    or agent_id = public.current_agent_id()
  )
);

create policy "users update brokerage agency agreements"
on public.agency_agreements for update
using (
  broker_id = public.current_broker_id()
  and (
    public.current_user_role() = 'broker'
    or agent_id = public.current_agent_id()
  )
)
with check (broker_id = public.current_broker_id());

create policy "users read agency compliance"
on public.agency_compliance_items for select
using (
  exists (
    select 1 from public.agency_agreements aa
    where aa.id = agency_compliance_items.agency_agreement_id
      and aa.broker_id = public.current_broker_id()
  )
);

create policy "users insert agency compliance"
on public.agency_compliance_items for insert
with check (
  exists (
    select 1 from public.agency_agreements aa
    where aa.id = agency_compliance_items.agency_agreement_id
      and aa.broker_id = public.current_broker_id()
  )
);

create policy "users update agency compliance"
on public.agency_compliance_items for update
using (
  exists (
    select 1 from public.agency_agreements aa
    where aa.id = agency_compliance_items.agency_agreement_id
      and aa.broker_id = public.current_broker_id()
  )
)
with check (
  exists (
    select 1 from public.agency_agreements aa
    where aa.id = agency_compliance_items.agency_agreement_id
      and aa.broker_id = public.current_broker_id()
  )
);

create policy "users read brokerage listings"
on public.listings for select
using (broker_id = public.current_broker_id());

create policy "users insert brokerage listings"
on public.listings for insert
with check (
  broker_id = public.current_broker_id()
  and (
    public.current_user_role() = 'broker'
    or agent_id = public.current_agent_id()
  )
);

create policy "users update brokerage listings"
on public.listings for update
using (
  broker_id = public.current_broker_id()
  and (
    public.current_user_role() = 'broker'
    or agent_id = public.current_agent_id()
  )
)
with check (broker_id = public.current_broker_id());

create policy "users read listing documents"
on public.listing_documents for select
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_documents.listing_id
      and l.broker_id = public.current_broker_id()
  )
);

create policy "users insert listing documents"
on public.listing_documents for insert
with check (
  exists (
    select 1 from public.listings l
    where l.id = listing_documents.listing_id
      and l.broker_id = public.current_broker_id()
  )
);

create policy "users read brokerage transactions"
on public.transactions for select
using (broker_id = public.current_broker_id());

create policy "users insert brokerage transactions"
on public.transactions for insert
with check (
  broker_id = public.current_broker_id()
  and (
    public.current_user_role() = 'broker'
    or agent_id = public.current_agent_id()
  )
);

create policy "users update brokerage transactions"
on public.transactions for update
using (
  broker_id = public.current_broker_id()
  and (
    public.current_user_role() = 'broker'
    or agent_id = public.current_agent_id()
  )
)
with check (broker_id = public.current_broker_id());

create policy "users read transaction documents"
on public.transaction_documents for select
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_documents.transaction_id
      and t.broker_id = public.current_broker_id()
  )
);

create policy "users manage transaction documents"
on public.transaction_documents for all
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_documents.transaction_id
      and t.broker_id = public.current_broker_id()
  )
)
with check (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_documents.transaction_id
      and t.broker_id = public.current_broker_id()
  )
);

create policy "users read transaction deadlines"
on public.transaction_deadlines for select
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_deadlines.transaction_id
      and t.broker_id = public.current_broker_id()
  )
);

create policy "users manage transaction deadlines"
on public.transaction_deadlines for all
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_deadlines.transaction_id
      and t.broker_id = public.current_broker_id()
  )
)
with check (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_deadlines.transaction_id
      and t.broker_id = public.current_broker_id()
  )
);

create policy "users read transaction compliance"
on public.transaction_compliance_items for select
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_compliance_items.transaction_id
      and t.broker_id = public.current_broker_id()
  )
);

create policy "users manage transaction compliance"
on public.transaction_compliance_items for all
using (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_compliance_items.transaction_id
      and t.broker_id = public.current_broker_id()
  )
)
with check (
  exists (
    select 1 from public.transactions t
    where t.id = transaction_compliance_items.transaction_id
      and t.broker_id = public.current_broker_id()
  )
);

create policy "users read incoming emails"
on public.incoming_emails for select
using (broker_id = public.current_broker_id());

create policy "users manage incoming emails"
on public.incoming_emails for all
using (broker_id = public.current_broker_id())
with check (broker_id = public.current_broker_id());

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

create policy "users can read certificate files"
on storage.objects for select
using (bucket_id = 'certificates');

create policy "users can upload certificate files"
on storage.objects for insert
with check (
  bucket_id = 'certificates'
  and auth.role() = 'authenticated'
);

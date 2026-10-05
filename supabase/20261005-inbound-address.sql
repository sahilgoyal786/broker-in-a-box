-- Per-broker inbound address on brokercommandcenter.com
-- Run manually in the Supabase SQL editor. Idempotent.

alter table public.brokers
  add column if not exists brokerage_name text,
  add column if not exists inbound_handle text,
  add column if not exists inbound_handle_edited boolean not null default false;

alter table public.brokers
  drop constraint if exists brokers_inbound_handle_format;
alter table public.brokers
  add constraint brokers_inbound_handle_format
  check (inbound_handle is null or inbound_handle ~ '^[a-z0-9]{3,40}$');

create unique index if not exists brokers_inbound_handle_key
  on public.brokers (inbound_handle);

-- Backfill existing brokers: slug of name, numeric suffix on collision.
with base as (
  select
    id,
    coalesce(
      nullif(left(lower(regexp_replace(coalesce(nullif(brokerage_name, ''), name), '[^a-zA-Z0-9]', '', 'g')), 36), ''),
      'broker'
    ) as slug,
    created_at
  from public.brokers
  where inbound_handle is null
),
ranked as (
  select id, slug,
    row_number() over (partition by slug order by created_at, id) as rn
  from base
)
update public.brokers b
set inbound_handle = case
      when length(r.slug) < 3 then r.slug || 'broker' || (case when r.rn > 1 then r.rn::text else '' end)
      when r.rn > 1 then r.slug || r.rn::text
      else r.slug
    end,
    submission_address = null
from ranked r
where b.id = r.id
  and not exists (
    select 1 from public.brokers x
    where x.inbound_handle = r.slug and x.id <> b.id
  );

-- Full address is derived from the handle.
update public.brokers
set submission_address = inbound_handle || '@brokercommandcenter.com'
where inbound_handle is not null;

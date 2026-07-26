begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function public.current_agent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select a.id
  from public.agents a
  where a.auth_user_id = auth.uid()
  limit 1
$$;

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

do $$
begin
  if exists (select 1 from pg_type where typname = 'transaction_status') then
    alter type public.transaction_status add value if not exists 'pending_closure';
    alter type public.transaction_status add value if not exists 'pending_cancellation';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'status'
      and data_type = 'text'
  ) then
    alter table public.transactions
      drop constraint if exists transactions_status_check;

    alter table public.transactions
      add constraint transactions_status_check
      check (status in (
        'pending',
        'active',
        'under_contract',
        'pending_closure',
        'pending_cancellation',
        'closed',
        'cancelled',
        'close_requested',
        'cancel_requested'
      ));
  end if;
end $$;

alter table public.transaction_compliance_items
  add column if not exists agent_provided boolean not null default false,
  add column if not exists agent_provided_at timestamptz,
  add column if not exists agent_provided_by uuid references auth.users(id) on delete set null,
  add column if not exists broker_approval_status text not null default 'pending';

alter table public.transaction_compliance_items
  drop constraint if exists transaction_compliance_broker_approval_status_check;

alter table public.transaction_compliance_items
  add constraint transaction_compliance_broker_approval_status_check
  check (broker_approval_status in ('pending', 'approved', 'rejected', 'waived'));

alter table public.transaction_documents
  add column if not exists visible boolean not null default true,
  add column if not exists visibility_status text not null default 'active',
  add column if not exists hidden_by uuid references auth.users(id) on delete set null,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_reason text,
  add column if not exists restored_by uuid references auth.users(id) on delete set null,
  add column if not exists restored_at timestamptz;

alter table public.transaction_documents
  drop constraint if exists transaction_documents_visibility_status_check;

alter table public.transaction_documents
  add constraint transaction_documents_visibility_status_check
  check (visibility_status in ('active', 'hidden', 'restored', 'superseded', 'rejected'));

create or replace function public.guard_v1_transaction_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text := public.current_user_role();
begin
  if actor_role = 'agent' then
    if new.broker_id is distinct from old.broker_id then
      raise exception 'Agents cannot change transaction broker ownership';
    end if;

    if new.agent_id is distinct from old.agent_id then
      raise exception 'Agents cannot reassign transactions';
    end if;

    if new.status is distinct from old.status then
      if old.status not in ('active', 'pending', 'under_contract')
         or new.status not in ('pending_closure', 'pending_cancellation') then
        raise exception 'Agents can only submit open transactions for office review';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_v1_transaction_update on public.transactions;
create trigger guard_v1_transaction_update
  before update on public.transactions
  for each row execute function public.guard_v1_transaction_update();

create or replace function public.guard_v1_transaction_document_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text := public.current_user_role();
begin
  if actor_role = 'agent' and tg_op = 'DELETE' then
    raise exception 'Agents cannot permanently delete transaction documents';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if actor_role = 'agent' and tg_op = 'INSERT' then
    new.verified := false;
    new.signatures_verified := false;
    new.ai_confidence := null;
    new.ai_identified_as := null;
    new.visible := true;
    new.visibility_status := 'active';
    new.hidden_by := null;
    new.hidden_at := null;
    new.restored_by := null;
    new.restored_at := null;
  end if;

  if actor_role = 'agent' and tg_op = 'UPDATE' then
    if new.transaction_id is distinct from old.transaction_id
       or new.form_identifier is distinct from old.form_identifier
       or new.form_name is distinct from old.form_name
       or new.original_filename is distinct from old.original_filename
       or new.drive_file_id is distinct from old.drive_file_id
       or new.received_at is distinct from old.received_at
       or new.received_via is distinct from old.received_via
       or new.ai_confidence is distinct from old.ai_confidence
       or new.ai_identified_as is distinct from old.ai_identified_as
       or new.verified is distinct from old.verified
       or new.signatures_verified is distinct from old.signatures_verified then
      raise exception 'Agents can only change document visibility fields';
    end if;

    if old.visibility_status in ('rejected', 'superseded')
       and new.visibility_status is distinct from old.visibility_status then
      raise exception 'Agents cannot restore broker-controlled document states';
    end if;

    if new.visibility_status in ('rejected', 'superseded') then
      raise exception 'Agents cannot set broker-controlled document states';
    end if;

    if new.visible = false and old.visible is distinct from false then
      new.hidden_by := auth.uid();
      new.hidden_at := now();
      new.visibility_status := 'hidden';
    elsif new.hidden_by is distinct from old.hidden_by
       or new.hidden_at is distinct from old.hidden_at then
      raise exception 'Agents cannot change document hide audit fields';
    end if;

    if new.visible = true and old.visible is distinct from true then
      new.restored_by := auth.uid();
      new.restored_at := now();
      if old.visibility_status = 'hidden' then
        new.visibility_status := 'restored';
      end if;
    elsif new.restored_by is distinct from old.restored_by
       or new.restored_at is distinct from old.restored_at then
      raise exception 'Agents cannot change document restore audit fields';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_v1_transaction_document_insert on public.transaction_documents;
create trigger guard_v1_transaction_document_insert
  before insert on public.transaction_documents
  for each row execute function public.guard_v1_transaction_document_write();

drop trigger if exists guard_v1_transaction_document_update on public.transaction_documents;
create trigger guard_v1_transaction_document_update
  before update on public.transaction_documents
  for each row execute function public.guard_v1_transaction_document_write();

drop trigger if exists guard_v1_transaction_document_delete on public.transaction_documents;
create trigger guard_v1_transaction_document_delete
  before delete on public.transaction_documents
  for each row execute function public.guard_v1_transaction_document_write();

create or replace function public.guard_v1_transaction_compliance_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text := public.current_user_role();
begin
  if actor_role = 'agent' and tg_op = 'INSERT' then
    if new.is_complete = true
       or new.completed_at is not null
       or new.broker_approval_status <> 'pending' then
      raise exception 'Agents cannot create broker-approved compliance items';
    end if;
  end if;

  if actor_role = 'agent' and tg_op = 'UPDATE' then
    if new.transaction_id is distinct from old.transaction_id
       or new.form_name is distinct from old.form_name
       or new.tracking_type is distinct from old.tracking_type
       or new.is_required is distinct from old.is_required
       or new.is_complete is distinct from old.is_complete
       or new.completed_at is distinct from old.completed_at
       or new.sort_order is distinct from old.sort_order
       or new.broker_approval_status is distinct from old.broker_approval_status then
      raise exception 'Agents can only mark transaction checklist items as provided';
    end if;

    if new.agent_provided = true and old.agent_provided is distinct from true then
      new.agent_provided_by := coalesce(new.agent_provided_by, auth.uid());
      new.agent_provided_at := coalesce(new.agent_provided_at, now());
    end if;

    if new.agent_provided = false and old.agent_provided is distinct from false then
      new.agent_provided_by := null;
      new.agent_provided_at := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_v1_transaction_compliance_insert on public.transaction_compliance_items;
create trigger guard_v1_transaction_compliance_insert
  before insert on public.transaction_compliance_items
  for each row execute function public.guard_v1_transaction_compliance_write();

drop trigger if exists guard_v1_transaction_compliance_update on public.transaction_compliance_items;
create trigger guard_v1_transaction_compliance_update
  before update on public.transaction_compliance_items
  for each row execute function public.guard_v1_transaction_compliance_write();

drop policy if exists "Brokers can manage own transactions" on public.transactions;
drop policy if exists "Users can manage transactions based on role" on public.transactions;
drop policy if exists "users read brokerage transactions" on public.transactions;
drop policy if exists "users insert brokerage transactions" on public.transactions;
drop policy if exists "users update brokerage transactions" on public.transactions;
drop policy if exists "users read authorized transactions" on public.transactions;
drop policy if exists "users insert authorized transactions" on public.transactions;
drop policy if exists "users update authorized transactions" on public.transactions;

create policy "users read authorized transactions"
  on public.transactions for select
  using (
    broker_id = public.current_broker_id()
    and (
      public.current_user_role() = 'broker'
      or agent_id = public.current_agent_id()
    )
  );

create policy "users insert authorized transactions"
  on public.transactions for insert
  with check (
    broker_id = public.current_broker_id()
    and (
      public.current_user_role() = 'broker'
      or agent_id = public.current_agent_id()
    )
  );

create policy "users update authorized transactions"
  on public.transactions for update
  using (
    broker_id = public.current_broker_id()
    and (
      public.current_user_role() = 'broker'
      or agent_id = public.current_agent_id()
    )
  )
  with check (
    broker_id = public.current_broker_id()
    and (
      public.current_user_role() = 'broker'
      or agent_id = public.current_agent_id()
    )
  );

drop policy if exists "users manage transaction compliance" on public.transaction_compliance_items;
drop policy if exists "users read transaction compliance" on public.transaction_compliance_items;
drop policy if exists "users manage authorized transaction compliance" on public.transaction_compliance_items;
drop policy if exists "users read authorized transaction compliance" on public.transaction_compliance_items;
drop policy if exists "users insert authorized transaction compliance" on public.transaction_compliance_items;
drop policy if exists "users update authorized transaction compliance" on public.transaction_compliance_items;
drop policy if exists "Brokers can view all transaction compliance" on public.transaction_compliance_items;
drop policy if exists "Agents can view their own transaction compliance" on public.transaction_compliance_items;
drop policy if exists "Brokers can insert transaction compliance" on public.transaction_compliance_items;
drop policy if exists "Agents can insert their own transaction compliance" on public.transaction_compliance_items;
drop policy if exists "Brokers can update all transaction compliance" on public.transaction_compliance_items;
drop policy if exists "Agents can update their own transaction compliance" on public.transaction_compliance_items;

create policy "users read authorized transaction compliance"
  on public.transaction_compliance_items for select
  using (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_compliance_items.transaction_id
        and t.broker_id = public.current_broker_id()
        and (
          public.current_user_role() = 'broker'
          or t.agent_id = public.current_agent_id()
        )
    )
  );

create policy "users insert authorized transaction compliance"
  on public.transaction_compliance_items for insert
  with check (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_compliance_items.transaction_id
        and t.broker_id = public.current_broker_id()
        and (
          public.current_user_role() = 'broker'
          or t.agent_id = public.current_agent_id()
        )
    )
  );

create policy "users update authorized transaction compliance"
  on public.transaction_compliance_items for update
  using (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_compliance_items.transaction_id
        and t.broker_id = public.current_broker_id()
        and (
          public.current_user_role() = 'broker'
          or t.agent_id = public.current_agent_id()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_compliance_items.transaction_id
        and t.broker_id = public.current_broker_id()
        and (
          public.current_user_role() = 'broker'
          or t.agent_id = public.current_agent_id()
        )
    )
  );

drop policy if exists "users manage transaction documents" on public.transaction_documents;
drop policy if exists "users read transaction documents" on public.transaction_documents;
drop policy if exists "users manage authorized transaction documents" on public.transaction_documents;
drop policy if exists "users read authorized transaction documents" on public.transaction_documents;
drop policy if exists "users insert authorized transaction documents" on public.transaction_documents;
drop policy if exists "users update authorized transaction documents" on public.transaction_documents;
drop policy if exists "Brokers can manage documents on own transactions" on public.transaction_documents;

create policy "users read authorized transaction documents"
  on public.transaction_documents for select
  using (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_documents.transaction_id
        and t.broker_id = public.current_broker_id()
        and (
          public.current_user_role() = 'broker'
          or t.agent_id = public.current_agent_id()
        )
    )
  );

create policy "users insert authorized transaction documents"
  on public.transaction_documents for insert
  with check (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_documents.transaction_id
        and t.broker_id = public.current_broker_id()
        and (
          public.current_user_role() = 'broker'
          or t.agent_id = public.current_agent_id()
        )
    )
  );

create policy "users update authorized transaction documents"
  on public.transaction_documents for update
  using (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_documents.transaction_id
        and t.broker_id = public.current_broker_id()
        and (
          public.current_user_role() = 'broker'
          or t.agent_id = public.current_agent_id()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_documents.transaction_id
        and t.broker_id = public.current_broker_id()
        and (
          public.current_user_role() = 'broker'
          or t.agent_id = public.current_agent_id()
        )
    )
  );

commit;

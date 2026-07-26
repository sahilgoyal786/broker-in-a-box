-- Read-only review before applying 20260726-enforce-v1-agent-permissions.sql.
-- This query should not modify schema or data.

select
  'policies' as section,
  p.schemaname as schema_name,
  p.tablename as object_name,
  p.policyname as item_name,
  p.cmd as detail_1,
  array_to_string(p.roles, ', ') as detail_2
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in (
    'transactions',
    'transaction_documents',
    'transaction_compliance_items'
  )

union all

select
  'columns' as section,
  c.table_schema as schema_name,
  c.table_name as object_name,
  c.column_name as item_name,
  c.data_type as detail_1,
  coalesce(c.column_default, '') as detail_2
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in (
    'transactions',
    'transaction_documents',
    'transaction_compliance_items'
  )
  and c.column_name in (
    'broker_id',
    'agent_id',
    'status',
    'visible',
    'visibility_status',
    'hidden_by',
    'hidden_at',
    'hidden_reason',
    'restored_by',
    'restored_at',
    'agent_provided',
    'agent_provided_at',
    'agent_provided_by',
    'broker_approval_status',
    'is_complete',
    'completed_at',
    'verified',
    'signatures_verified'
  )

union all

select
  'triggers' as section,
  t.trigger_schema as schema_name,
  t.event_object_table as object_name,
  t.trigger_name as item_name,
  t.event_manipulation as detail_1,
  t.action_timing as detail_2
from information_schema.triggers t
where t.trigger_schema = 'public'
  and t.event_object_table in (
    'transactions',
    'transaction_documents',
    'transaction_compliance_items'
  )

order by section, object_name, item_name, detail_1;

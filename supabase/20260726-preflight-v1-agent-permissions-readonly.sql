-- Read-only preflight before applying 20260726-enforce-v1-agent-permissions.sql.
-- This verifies live status values and trigger-referenced columns that must already exist.

with expected_columns(table_name, column_name) as (
  values
    ('transactions', 'broker_id'),
    ('transactions', 'agent_id'),
    ('transactions', 'status'),
    ('transaction_documents', 'transaction_id'),
    ('transaction_documents', 'form_identifier'),
    ('transaction_documents', 'form_name'),
    ('transaction_documents', 'original_filename'),
    ('transaction_documents', 'drive_file_id'),
    ('transaction_documents', 'received_at'),
    ('transaction_documents', 'received_via'),
    ('transaction_documents', 'ai_confidence'),
    ('transaction_documents', 'ai_identified_as'),
    ('transaction_documents', 'verified'),
    ('transaction_documents', 'signatures_verified'),
    ('transaction_compliance_items', 'transaction_id'),
    ('transaction_compliance_items', 'form_name'),
    ('transaction_compliance_items', 'tracking_type'),
    ('transaction_compliance_items', 'is_required'),
    ('transaction_compliance_items', 'is_complete'),
    ('transaction_compliance_items', 'completed_at'),
    ('transaction_compliance_items', 'sort_order')
)
select
  'expected_column' as section,
  e.table_name as object_name,
  e.column_name as item_name,
  case when c.column_name is null then 'missing' else 'present' end as detail_1,
  coalesce(c.data_type, '') as detail_2
from expected_columns e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = e.table_name
 and c.column_name = e.column_name

union all

select
  'transaction_status_value' as section,
  'transactions' as object_name,
  status::text as item_name,
  count(*)::text as detail_1,
  case
    when status::text in (
      'pending',
      'active',
      'under_contract',
      'pending_closure',
      'pending_cancellation',
      'closed',
      'cancelled',
      'close_requested',
      'cancel_requested'
    ) then 'allowed'
    else 'blocked_by_new_check'
  end as detail_2
from public.transactions
group by status::text

order by section, object_name, item_name;

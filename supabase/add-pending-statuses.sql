-- Add pending closure/cancellation statuses for agent requests
ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'pending_closure';
ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'pending_cancellation';

-- Add fields to track who requested and when
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS close_requested_at timestamptz;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS close_requested_by uuid REFERENCES agents(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cancel_requested_by uuid REFERENCES agents(id);

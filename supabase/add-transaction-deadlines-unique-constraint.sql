-- Add unique constraint for transaction_deadlines (transaction_id, label)
-- This allows upsert operations when syncing calendar events

ALTER TABLE transaction_deadlines
ADD CONSTRAINT transaction_deadlines_transaction_label_unique 
UNIQUE (transaction_id, label);

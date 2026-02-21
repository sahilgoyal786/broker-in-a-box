-- Add cooperating broker/agent fields to transactions
-- Cooperating broker = the other side (buyer's agent if you're listing, listing agent if you're buyer)

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS cooperating_brokerage TEXT,
ADD COLUMN IF NOT EXISTS cooperating_agent_name TEXT,
ADD COLUMN IF NOT EXISTS cooperating_agent_phone TEXT,
ADD COLUMN IF NOT EXISTS cooperating_agent_email TEXT;

-- Add index for searching by cooperating agent
CREATE INDEX IF NOT EXISTS idx_transactions_cooperating_agent ON transactions(cooperating_agent_name);

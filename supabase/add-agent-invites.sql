-- Add invite fields to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS invite_token TEXT,
ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invite_status TEXT DEFAULT 'pending' CHECK (invite_status IN ('pending', 'invited', 'active'));

-- Create index on invite_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_agents_invite_token ON agents(invite_token);

-- Update existing agents without auth_user_id to 'pending' status
UPDATE agents 
SET invite_status = 'pending' 
WHERE auth_user_id IS NULL AND invite_status IS NULL;

-- Update existing agents with auth_user_id to 'active' status
UPDATE agents 
SET invite_status = 'active' 
WHERE auth_user_id IS NOT NULL;

-- ============================================================
-- Add Role-Based Access (Broker vs Agent)
-- Wall of Confidentiality: Agents see only their own deals
-- ============================================================

-- 1. Create role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('broker', 'agent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add role to brokers table
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'broker';

-- Update existing broker to have broker role
UPDATE brokers SET role = 'broker' WHERE role IS NULL;

-- Make role required
ALTER TABLE brokers ALTER COLUMN role SET NOT NULL;

-- 3. Link agents to auth users (so agents can log in)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'agent';

-- Make role required for agents
UPDATE agents SET role = 'agent' WHERE role IS NULL;

-- 4. Update RLS policies for wall of confidentiality

-- Transactions: Brokers see all, agents see only theirs
DROP POLICY IF EXISTS "Brokers can manage own transactions" ON transactions;

CREATE POLICY "Users can manage transactions based on role"
  ON transactions FOR ALL
  USING (
    broker_id IN (
      SELECT b.id FROM brokers b 
      WHERE b.auth_user_id = auth.uid()
      AND (
        b.role = 'broker'  -- Broker sees all
        OR (
          b.role = 'agent' 
          AND agent_id IN (
            SELECT id FROM agents WHERE auth_user_id = auth.uid()  -- Agent sees only theirs
          )
        )
      )
    )
  );

-- Agency Agreements: Brokers see all, agents see only theirs
DROP POLICY IF EXISTS "Brokers can manage own agency agreements" ON agency_agreements;

CREATE POLICY "Users can manage agency agreements based on role"
  ON agency_agreements FOR ALL
  USING (
    broker_id IN (
      SELECT b.id FROM brokers b 
      WHERE b.auth_user_id = auth.uid()
      AND (
        b.role = 'broker'  -- Broker sees all
        OR (
          b.role = 'agent'
          AND agent_id IN (
            SELECT id FROM agents WHERE auth_user_id = auth.uid()  -- Agent sees only theirs
          )
        )
      )
    )
  );

-- Agents table: Brokers see all agents, agents see only themselves
DROP POLICY IF EXISTS "Brokers can manage own agents" ON agents;

CREATE POLICY "Users can view agents based on role"
  ON agents FOR SELECT
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE auth_user_id = auth.uid() AND role = 'broker'  -- Broker sees all
    )
    OR auth_user_id = auth.uid()  -- Agent sees only themselves
  );

CREATE POLICY "Brokers can manage agents"
  ON agents FOR INSERT
  WITH CHECK (
    broker_id IN (
      SELECT id FROM brokers WHERE auth_user_id = auth.uid() AND role = 'broker'
    )
  );

CREATE POLICY "Brokers can update agents"
  ON agents FOR UPDATE
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE auth_user_id = auth.uid() AND role = 'broker'
    )
  );

-- 5. Add helper function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM brokers WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 6. Add comments
COMMENT ON COLUMN brokers.role IS 'User role: broker (sees all) or agent (sees only their deals)';
COMMENT ON COLUMN agents.auth_user_id IS 'Links agent to their login account';
COMMENT ON COLUMN agents.role IS 'Always agent for agent records';

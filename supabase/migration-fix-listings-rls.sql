-- Fix RLS policies for listings table
-- Problem: auth.uid() != broker_id (auth.uid is auth user, broker_id is broker record)

-- Drop old policies
DROP POLICY IF EXISTS "Brokers can view all listings" ON listings;
DROP POLICY IF EXISTS "Brokers can insert listings" ON listings;
DROP POLICY IF EXISTS "Brokers can update all listings" ON listings;
DROP POLICY IF EXISTS "Agents can view own listings" ON listings;
DROP POLICY IF EXISTS "Agents can insert own listings" ON listings;
DROP POLICY IF EXISTS "Agents can update own listings" ON listings;

-- Brokers: Check if auth user owns the broker record
CREATE POLICY "Brokers can view all listings" ON listings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brokers 
      WHERE brokers.id = listings.broker_id 
      AND brokers.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Brokers can insert listings" ON listings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brokers 
      WHERE brokers.id = listings.broker_id 
      AND brokers.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Brokers can update all listings" ON listings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM brokers 
      WHERE brokers.id = listings.broker_id 
      AND brokers.auth_user_id = auth.uid()
    )
  );

-- Agents: Check if auth user owns the agent record
CREATE POLICY "Agents can view own listings" ON listings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = listings.agent_id 
      AND agents.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can insert own listings" ON listings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = listings.agent_id 
      AND agents.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update own listings" ON listings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = listings.agent_id 
      AND agents.auth_user_id = auth.uid()
    )
  );

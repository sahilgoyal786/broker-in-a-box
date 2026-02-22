-- Create agency_compliance_items table
-- Tracks compliance checklist for agency agreements (listings and buyer agreements)

CREATE TABLE IF NOT EXISTS agency_compliance_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_agreement_id UUID NOT NULL REFERENCES agency_agreements(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL,
  tracking_type TEXT NOT NULL, -- 'manual_checkbox', 'pdf_auto', 'manual_upload'
  is_required BOOLEAN DEFAULT true,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  file_url TEXT, -- For PDF uploads (future)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_agency_compliance_agency_id 
  ON agency_compliance_items(agency_agreement_id);

-- RLS Policies: Brokers see all, agents see only their own
ALTER TABLE agency_compliance_items ENABLE ROW LEVEL SECURITY;

-- Broker can see all compliance items for their brokerage
CREATE POLICY "Brokers can view all agency compliance items"
  ON agency_compliance_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agency_agreements aa
      WHERE aa.id = agency_compliance_items.agency_agreement_id
      AND aa.broker_id = (
        SELECT id FROM brokers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Agent can only see compliance items for their own agency agreements
CREATE POLICY "Agents can view their own agency compliance items"
  ON agency_compliance_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agency_agreements aa
      JOIN agents a ON a.id = aa.agent_id
      WHERE aa.id = agency_compliance_items.agency_agreement_id
      AND a.auth_user_id = auth.uid()
    )
  );

-- Broker can insert/update all compliance items
CREATE POLICY "Brokers can manage all agency compliance items"
  ON agency_compliance_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agency_agreements aa
      WHERE aa.id = agency_compliance_items.agency_agreement_id
      AND aa.broker_id = (
        SELECT id FROM brokers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Agent can update their own compliance items (check boxes)
CREATE POLICY "Agents can update their own agency compliance items"
  ON agency_compliance_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agency_agreements aa
      JOIN agents a ON a.id = aa.agent_id
      WHERE aa.id = agency_compliance_items.agency_agreement_id
      AND a.auth_user_id = auth.uid()
    )
  );

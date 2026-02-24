-- Create transaction_compliance_items table
CREATE TABLE IF NOT EXISTS transaction_compliance_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL,
  tracking_type TEXT NOT NULL CHECK (tracking_type IN ('pdf_auto', 'manual_checkbox', 'manual_upload', 'inherited', 'optional_any')),
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_compliance_transaction_id ON transaction_compliance_items(transaction_id); I will need you to update those files because I just renamed old and so that I can rename the new the old one

-- Enable RLS
ALTER TABLE transaction_compliance_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Brokers see all, agents see only their own
CREATE POLICY "Brokers can view all transaction compliance"
  ON transaction_compliance_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brokers
      WHERE brokers.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can view their own transaction compliance"
  ON transaction_compliance_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN agents a ON t.agent_id = a.id
      WHERE t.id = transaction_compliance_items.transaction_id
      AND a.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Brokers can insert transaction compliance"
  ON transaction_compliance_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN brokers b ON t.broker_id = b.id
      WHERE t.id = transaction_compliance_items.transaction_id
      AND b.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can insert their own transaction compliance"
  ON transaction_compliance_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN agents a ON t.agent_id = a.id
      WHERE t.id = transaction_compliance_items.transaction_id
      AND a.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Brokers can update all transaction compliance"
  ON transaction_compliance_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM brokers
      WHERE brokers.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update their own transaction compliance"
  ON transaction_compliance_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN agents a ON t.agent_id = a.id
      WHERE t.id = transaction_compliance_items.transaction_id
      AND a.auth_user_id = auth.uid()
    )
  );

-- Function to auto-populate transaction compliance items
CREATE OR REPLACE FUNCTION populate_transaction_compliance()
RETURNS TRIGGER AS $$
DECLARE
  prop_type TEXT;
  trans_type TEXT;
  sort_counter INTEGER := 0;
BEGIN
  -- Get property type and transaction type
  prop_type := NEW.property_type;
  trans_type := NEW.transaction_type;

  -- Skip farm and residential_lease (no compliance requirements)
  IF prop_type IN ('farm', 'residential_lease') THEN
    RETURN NEW;
  END IF;

  -- Core forms for ALL transactions (sort order 1-4)
  sort_counter := 1;
  INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
  VALUES (NEW.id, 'REAL ESTATE PURCHASE CONTRACT', 'pdf_auto', true, sort_counter);

  sort_counter := sort_counter + 1;
  INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
  VALUES (NEW.id, 'All Addenda', 'manual_checkbox', false, sort_counter);

  -- Property-specific Seller's Property Condition Disclosure
  sort_counter := sort_counter + 1;
  IF prop_type = 'vacant_land' THEN
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'SELLER''S PROPERTY CONDITION DISCLOSURE -- LAND SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
  ELSIF prop_type IN ('commercial', 'multi_unit') THEN
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'COMMERCIAL SELLER''S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
  ELSE -- residential
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'SELLER''S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
  END IF;

  sort_counter := sort_counter + 1;
  INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
  VALUES (NEW.id, 'CONFIRMATION OF RECEIPT OF EARNEST MONEY', 'pdf_auto', true, sort_counter);

  -- Buyer-side forms (buyer_agency and limited_agency types only)
  -- Listing agents don't handle earnest money deposit - that's the buyer's agent's job
  IF trans_type IN ('buyer_agency', 'limited_agency') THEN
    sort_counter := sort_counter + 1;
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'Earnest Money Deposit Receipt', 'manual_upload', true, sort_counter);
  END IF;

  -- TODO: Add lead paint disclosure for pre-1978 residential/multi-unit properties
  -- Need to add year_built field to transactions table first

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate compliance items when transaction is created
DROP TRIGGER IF EXISTS trigger_populate_transaction_compliance ON transactions;
CREATE TRIGGER trigger_populate_transaction_compliance
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION populate_transaction_compliance();

-- Also handle updates (if property_type changes)
CREATE OR REPLACE FUNCTION update_transaction_compliance()
RETURNS TRIGGER AS $$
BEGIN
  -- If property type changed, regenerate compliance items
  IF OLD.property_type IS DISTINCT FROM NEW.property_type THEN
    
    -- Delete existing items
    DELETE FROM transaction_compliance_items WHERE transaction_id = NEW.id;
    
    -- Repopulate
    PERFORM populate_transaction_compliance() FROM transactions WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transaction_compliance ON transactions;
CREATE TRIGGER trigger_update_transaction_compliance
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_compliance();

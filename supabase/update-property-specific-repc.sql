-- Update REPC form names to be property-specific

-- First, update existing compliance items to use property-specific REPC names
UPDATE transaction_compliance_items tci
SET form_name = CASE 
  WHEN t.property_type = 'vacant_land' THEN 'REAL ESTATE PURCHASE CONTRACT - LAND'
  WHEN t.property_type = 'commercial' THEN 'COMMERCIAL REAL ESTATE PURCHASE CONTRACT'
  ELSE 'REAL ESTATE PURCHASE CONTRACT'
END
FROM transactions t
WHERE tci.transaction_id = t.id
AND tci.form_name = 'REAL ESTATE PURCHASE CONTRACT';

-- Update the trigger function to create property-specific REPC names
CREATE OR REPLACE FUNCTION populate_transaction_compliance()
RETURNS TRIGGER AS $$
DECLARE
  prop_type TEXT;
  trans_type TEXT;
  sort_counter INTEGER := 0;
  repc_name TEXT;
BEGIN
  -- Get property type and transaction type
  prop_type := NEW.property_type;
  trans_type := NEW.transaction_type;

  -- Skip farm and residential_lease (no compliance requirements)
  IF prop_type IN ('farm', 'residential_lease') THEN
    RETURN NEW;
  END IF;

  -- Determine property-specific REPC name
  IF prop_type = 'vacant_land' THEN
    repc_name := 'REAL ESTATE PURCHASE CONTRACT - LAND';
  ELSIF prop_type = 'commercial' THEN
    repc_name := 'COMMERCIAL REAL ESTATE PURCHASE CONTRACT';
  ELSE
    -- residential, multi_unit, mobile_home
    repc_name := 'REAL ESTATE PURCHASE CONTRACT';
  END IF;

  -- Core form 1: Property-specific REPC
  sort_counter := 1;
  INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
  VALUES (NEW.id, repc_name, 'pdf_auto', true, sort_counter);

  -- Core form 2: All Addenda
  sort_counter := sort_counter + 1;
  INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
  VALUES (NEW.id, 'All Addenda', 'manual_checkbox', false, sort_counter);

  -- Core form 3: Property-specific Seller's Property Condition Disclosure
  sort_counter := sort_counter + 1;
  IF prop_type = 'vacant_land' THEN
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'SELLER''S PROPERTY CONDITION DISCLOSURE -- LAND SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
  ELSIF prop_type IN ('commercial', 'multi_unit') THEN
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'COMMERCIAL SELLER''S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
  ELSE -- residential, mobile_home
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'SELLER''S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
  END IF;

  -- Core form 4: Confirmation of Receipt of Earnest Money
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

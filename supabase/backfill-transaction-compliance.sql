-- Backfill compliance items for existing transactions
-- This populates compliance checklists for transactions created before the trigger was added

DO $$
DECLARE
  txn RECORD;
  sort_counter INTEGER;
BEGIN
  -- Loop through all transactions that don't have compliance items yet
  FOR txn IN 
    SELECT t.id, t.property_type, t.transaction_type
    FROM transactions t
    WHERE NOT EXISTS (
      SELECT 1 FROM transaction_compliance_items 
      WHERE transaction_id = t.id
    )
  LOOP
    -- Skip farm and residential_lease (no compliance requirements)
    IF txn.property_type IN ('farm', 'residential_lease') THEN
      CONTINUE;
    END IF;

    sort_counter := 1;

    -- Core form 1: REPC
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (txn.id, 'REAL ESTATE PURCHASE CONTRACT', 'pdf_auto', true, sort_counter);

    -- Core form 2: All Addenda (optional)
    sort_counter := sort_counter + 1;
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (txn.id, 'All Addenda', 'manual_checkbox', false, sort_counter);

    -- Core form 3: Property-specific Seller's Property Condition Disclosure
    sort_counter := sort_counter + 1;
    IF txn.property_type = 'vacant_land' THEN
      INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
      VALUES (txn.id, 'SELLER''S PROPERTY CONDITION DISCLOSURE -- LAND SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
    ELSIF txn.property_type IN ('commercial', 'multi_unit') THEN
      INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
      VALUES (txn.id, 'COMMERCIAL SELLER''S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
    ELSE -- residential, mobile_home
      INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
      VALUES (txn.id, 'SELLER''S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
    END IF;

    -- Core form 4: Confirmation of Receipt of Earnest Money
    sort_counter := sort_counter + 1;
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (txn.id, 'CONFIRMATION OF RECEIPT OF EARNEST MONEY', 'pdf_auto', true, sort_counter);

    -- Buyer-side only: Earnest Money Deposit Receipt
    IF txn.transaction_type IN ('buyer_agency', 'limited_agency') THEN
      sort_counter := sort_counter + 1;
      INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
      VALUES (txn.id, 'Earnest Money Deposit Receipt', 'manual_upload', true, sort_counter);
    END IF;

    RAISE NOTICE 'Populated compliance items for transaction %', txn.id;
  END LOOP;
END $$;

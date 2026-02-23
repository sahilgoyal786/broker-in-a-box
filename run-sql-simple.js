const { createClient } = require('@supabase/supabase-js')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateTrigger() {
  console.log('Updating trigger function via Supabase SQL Editor...\n')
  console.log('Please manually run the SQL in supabase/update-property-specific-repc.sql')
  console.log('in the Supabase SQL Editor at:')
  console.log(`${supabaseUrl.replace('supabase.co', 'supabase.co')}/project/_/sql\n`)
  
  console.log('Or copy this function and paste it into the SQL Editor:\n')
  console.log('='.repeat(80))
  
  const triggerFunction = `
CREATE OR REPLACE FUNCTION populate_transaction_compliance()
RETURNS TRIGGER AS $$
DECLARE
  prop_type TEXT;
  trans_type TEXT;
  sort_counter INTEGER := 0;
  repc_name TEXT;
BEGIN
  prop_type := NEW.property_type;
  trans_type := NEW.transaction_type;

  IF prop_type IN ('farm', 'residential_lease') THEN
    RETURN NEW;
  END IF;

  -- Determine property-specific REPC name
  IF prop_type = 'vacant_land' THEN
    repc_name := 'REAL ESTATE PURCHASE CONTRACT - LAND';
  ELSIF prop_type = 'commercial' THEN
    repc_name := 'COMMERCIAL REAL ESTATE PURCHASE CONTRACT';
  ELSE
    repc_name := 'REAL ESTATE PURCHASE CONTRACT';
  END IF;

  sort_counter := 1;
  INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
  VALUES (NEW.id, repc_name, 'pdf_auto', true, sort_counter);

  sort_counter := sort_counter + 1;
  INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
  VALUES (NEW.id, 'All Addenda', 'manual_checkbox', false, sort_counter);

  sort_counter := sort_counter + 1;
  IF prop_type = 'vacant_land' THEN
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'SELLER''S PROPERTY CONDITION DISCLOSURE -- LAND SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
  ELSIF prop_type IN ('commercial', 'multi_unit') THEN
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'COMMERCIAL SELLER''S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
  ELSE
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'SELLER''S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER', 'pdf_auto', true, sort_counter);
  END IF;

  sort_counter := sort_counter + 1;
  INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
  VALUES (NEW.id, 'CONFIRMATION OF RECEIPT OF EARNEST MONEY', 'pdf_auto', true, sort_counter);

  IF trans_type IN ('buyer_agency', 'limited_agency') THEN
    sort_counter := sort_counter + 1;
    INSERT INTO transaction_compliance_items (transaction_id, form_name, tracking_type, is_required, sort_order)
    VALUES (NEW.id, 'Earnest Money Deposit Receipt', 'manual_upload', true, sort_counter);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`

  console.log(triggerFunction)
  console.log('='.repeat(80))
}

updateTrigger()

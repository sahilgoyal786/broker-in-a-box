-- Remove mobile_home from property_type enum constraints

-- Update agency_agreements table constraint
ALTER TABLE agency_agreements DROP CONSTRAINT IF EXISTS agency_agreements_property_type_check;
ALTER TABLE agency_agreements ADD CONSTRAINT agency_agreements_property_type_check 
  CHECK (property_type IN ('residential', 'vacant_land', 'commercial', 'multi_unit', 'farm', 'residential_lease'));

-- Update listings table constraint  
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_property_type_check;
ALTER TABLE listings ADD CONSTRAINT listings_property_type_check 
  CHECK (property_type IN ('residential', 'vacant_land', 'commercial', 'multi_unit', 'farm', 'residential_lease'));

-- Update transactions table constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_property_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_property_type_check 
  CHECK (property_type IN ('residential', 'vacant_land', 'commercial', 'multi_unit', 'farm', 'residential_lease'));

-- Note: Any existing mobile_home records will remain but new ones cannot be created
-- If needed, you can update existing records:
-- UPDATE agency_agreements SET property_type = 'residential' WHERE property_type = 'mobile_home';
-- UPDATE listings SET property_type = 'residential' WHERE property_type = 'mobile_home';
-- UPDATE transactions SET property_type = 'residential' WHERE property_type = 'mobile_home';

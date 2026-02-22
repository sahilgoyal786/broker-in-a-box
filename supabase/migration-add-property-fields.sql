-- Add property-type-specific fields to listings table
-- 2026-02-22: County, Tax ID, and property-specific fields

-- Universal fields (all property types)
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Vacant Land specific
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS lot_size_land TEXT,
ADD COLUMN IF NOT EXISTS zoning TEXT;

-- Multi-Unit specific
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS number_of_units INTEGER,
ADD COLUMN IF NOT EXISTS total_bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS total_bathrooms DECIMAL(3,1);

-- Commercial specific
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS commercial_use TEXT;

-- Also add to agency_agreements table for property info
ALTER TABLE agency_agreements
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT;

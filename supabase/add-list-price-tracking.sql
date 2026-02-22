-- Add original_list_price and current_list_price to listings
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS original_list_price DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS current_list_price DECIMAL(12, 2);

-- Migrate existing data: original = current = listing_price
UPDATE listings
SET 
  original_list_price = listing_price,
  current_list_price = listing_price
WHERE original_list_price IS NULL;

COMMENT ON COLUMN listings.original_list_price IS 'Original listing price when first listed';
COMMENT ON COLUMN listings.current_list_price IS 'Current listing price (may be reduced from original)';
COMMENT ON COLUMN listings.listing_price IS 'Legacy field - use current_list_price instead';
COMMENT ON COLUMN listings.sales_price IS 'Final sales price from purchase contract';

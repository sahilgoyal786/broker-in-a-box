-- Add 'limited_agency' to transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'limited_agency';

-- Note: New forms will use only three values:
-- 'listing' = Listing Agent (Representing Seller)
-- 'buyer_agency' = Buyer's Agent (Representing Buyer)
-- 'limited_agency' = Limited Agency - Buyer/Seller
--
-- Old values kept for backwards compatibility:
-- 'seller_purchase', 'buyer_purchase', 'unrepresented_buyer', 'fsbo_purchase'

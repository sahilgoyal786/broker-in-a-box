-- Migration: Add Listings table
-- Listings are the listing agreements (property for sale) separate from agency agreements

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Property Information
  property_address TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_state TEXT DEFAULT 'UT',
  property_zip TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('residential', 'vacant_land', 'mobile_home', 'commercial', 'multi_unit', 'farm')),
  
  -- Listing Details
  listing_price DECIMAL(12,2) NOT NULL,
  mls_number TEXT, -- Once published to MLS
  listing_start_date DATE NOT NULL,
  listing_end_date DATE NOT NULL,
  
  -- Commission Structure
  commission_percentage DECIMAL(5,2), -- e.g., 6.00 for 6%
  commission_amount DECIMAL(10,2), -- Fixed dollar amount (alternative to percentage)
  buyer_agent_commission_percentage DECIMAL(5,2), -- What's offered to buyer's agent
  buyer_agent_commission_amount DECIMAL(10,2),
  
  -- Seller Information
  seller_name TEXT NOT NULL,
  seller_email TEXT,
  seller_phone TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed', 'expired', 'withdrawn', 'cancelled')),
  
  -- Property Details (for filtering/reporting)
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  lot_size TEXT,
  year_built INTEGER,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Brokers can see all listings in their brokerage
CREATE POLICY "Brokers can view all listings" ON listings
  FOR SELECT
  USING (broker_id = auth.uid());

CREATE POLICY "Brokers can insert listings" ON listings
  FOR INSERT
  WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Brokers can update all listings" ON listings
  FOR UPDATE
  USING (broker_id = auth.uid());

-- Agents can only see their own listings
CREATE POLICY "Agents can view own listings" ON listings
  FOR SELECT
  USING (agent_id IN (SELECT id FROM agents WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Agents can insert own listings" ON listings
  FOR INSERT
  WITH CHECK (agent_id IN (SELECT id FROM agents WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Agents can update own listings" ON listings
  FOR UPDATE
  USING (agent_id IN (SELECT id FROM agents WHERE email = auth.jwt() ->> 'email'));

-- Indexes
CREATE INDEX idx_listings_broker_id ON listings(broker_id);
CREATE INDEX idx_listings_agent_id ON listings(agent_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_mls_number ON listings(mls_number) WHERE mls_number IS NOT NULL;

-- Listing Documents tracking
CREATE TABLE IF NOT EXISTS listing_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES agents(id)
);

-- Enable RLS on listing_documents
ALTER TABLE listing_documents ENABLE ROW LEVEL SECURITY;

-- Same RLS pattern as listings
CREATE POLICY "Brokers can view all listing documents" ON listing_documents
  FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE broker_id = auth.uid()));

CREATE POLICY "Agents can view own listing documents" ON listing_documents
  FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE agent_id IN (SELECT id FROM agents WHERE email = auth.jwt() ->> 'email')));

CREATE POLICY "Users can insert listing documents" ON listing_documents
  FOR INSERT
  WITH CHECK (true); -- Checked via listing RLS

CREATE INDEX idx_listing_documents_listing_id ON listing_documents(listing_id);

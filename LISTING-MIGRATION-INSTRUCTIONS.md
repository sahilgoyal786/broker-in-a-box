# Listings Migration Instructions

## Run the Migration

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc/sql/new

2. Copy the contents of `supabase/migration-add-listings.sql`

3. Paste into the SQL editor

4. Click "Run"

5. You should see "Success. No rows returned"

## What This Adds

- **`listings` table** - Tracks listing agreements (properties for sale)
  - Property details (address, type, price, features)
  - Listing period (start/end dates)
  - Commission structure
  - MLS number (once published)
  - Seller information
  - Status (active, pending, closed, expired, withdrawn, cancelled)

- **`listing_documents` table** - Tracks uploaded documents for each listing
  - Links to the listing
  - Document type
  - File URL
  - Upload timestamp

- **Row Level Security (RLS)** configured:
  - Brokers see all listings
  - Agents see only their own listings

## After Running

Once the migration is successful, come back to the chat and say "migration done" and I'll build the listing forms and views.

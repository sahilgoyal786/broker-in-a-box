# Run This Migration

## Step 1: Open SQL Editor
https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc/sql/new

## Step 2: Copy and paste this SQL:

```sql
-- Link listings to agency agreements
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS agency_agreement_id UUID REFERENCES agency_agreements(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_listings_agency_agreement_id ON listings(agency_agreement_id);
```

## Step 3: Click "Run"

You should see "Success. No rows returned"

## After Running:

The system is ready! Now when you view a Listing Agreement in Agency Agreements, you'll see:
- An "Add Property Details" button (if no property details exist yet)
- OR the property details display (if they've been added)
- Clicking "Add Property Details" will pre-fill the form with client/property info from the agency agreement

Let me know when you've run the migration and we can test it!

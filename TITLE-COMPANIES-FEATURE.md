# Title Companies Feature - 2026-02-21

## What Changed
Added full tracking for **both seller's and buyer's title companies** with contact details. This is separate from the earnest money holder tracking.

## Database Fields Added (8 new columns)
- `seller_title_company` - Company name
- `seller_title_contact_name` - Contact person
- `seller_title_contact_email` - Email
- `seller_title_contact_phone` - Phone

- `buyer_title_company` - Company name
- `buyer_title_contact_name` - Contact person
- `buyer_title_contact_email` - Email
- `buyer_title_contact_phone` - Phone

## UI Updates
### New Transaction Form
- Replaced simple "Title Company" dropdowns
- Added two full sections:
  - **Seller's Title Company** (company name + contact person + email + phone)
  - **Buyer's Title Company** (company name + contact person + email + phone)
- Followed by **Earnest Money Holder** section (unchanged)

### Edit Transaction Form
- Same layout as new form
- All fields default to existing values
- Dark theme styling maintained

### Transaction Detail Page
- Split the single "Title Companies" section into two:
  - **Seller's Title Company** - shows all 4 fields (company, contact, email, phone)
  - **Buyer's Title Company** - shows all 4 fields (company, contact, email, phone)
- Email and phone are clickable links (mailto/tel)
- Empty fields show "—" dashes

## Migration Required
**CRITICAL:** You must run this SQL in Supabase Dashboard before the app will work:

1. Go to: https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc/sql/new
2. Copy/paste the SQL from: `supabase/migration-add-title-companies.sql`
3. Click "Run"

## Files Modified
- `supabase/migration-add-title-companies.sql` (new)
- `app/dashboard/transactions/new/new-transaction-form.tsx`
- `app/dashboard/transactions/[id]/edit/edit-transaction-form.tsx`
- `app/dashboard/transactions/[id]/page.tsx`

## Why This Matters
In a real estate transaction:
- Earnest money might be held at one title company
- Seller might use a different title company for their side
- Buyer might use yet another title company for their side
- Or they could all be the same company

Now the broker can track all three independently and have contact info for whoever they need to reach.

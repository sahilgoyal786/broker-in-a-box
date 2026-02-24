# File ID Migration Instructions

## What This Adds

Sequential file IDs for Utah compliance requirements:
- **Agency agreements:** `2026-A00001`, `2026-A00002`, etc.
- **Transactions (sales):** `2026-S00001`, `2026-S00002`, etc.
- Auto-generates on creation
- Resets annually on January 1
- Two separate counters per broker

## Run Migration

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc
2. Click **SQL Editor** in left sidebar
3. Click **New query**
4. Copy/paste contents of: `supabase/add-file-id-tracking.sql`
5. Click **Run** (bottom right)
6. Wait for "Success. No rows returned" message

## Backfill Existing Records

The migration includes a backfill script that assigns file IDs to existing records in creation order.

**If you DON'T want to backfill existing records:**
- Remove the `DO $$` block at the bottom before running (lines starting with "-- Backfill existing records")

**If you DO want to backfill:**
- Run as-is
- Existing agencies will get: `2026-A00001`, `2026-A00002`, etc.
- Existing transactions will get: `2026-S00001`, `2026-S00002`, etc.

## After Migration

1. Update database types: Run `npm run db:types` in the project folder
2. Push to GitHub (triggers Vercel deploy)
3. New records will auto-generate file IDs
4. File IDs will display on detail pages and in table columns

## Testing

Create a new agency agreement:
- Should auto-assign next A number (e.g., `2026-A00004`)

Create a new transaction:
- Should auto-assign next S number (e.g., `2026-S00001`)

## Year Rollover

On January 1, 2027:
- Next agency: `2027-A00001` (counter resets)
- Next transaction: `2027-S00001` (counter resets)
- Happens automatically, no action needed

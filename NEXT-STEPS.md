# Next Steps - Broker in a Box

## What Just Changed

Split the data model into two separate lists:

1. **Agency Agreements** - Listing agreements and buyer agency agreements
2. **Transactions** - Purchase contracts (REPCs)

## To Test Locally

1. **Run the database migration:**
   - Go to https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc/sql
   - Click "New Query"
   - Copy/paste the contents of `supabase/migration-add-agencies.sql`
   - Click "Run"

2. **Restart the dev server** (if it's not already running):
   ```
   cd C:\Users\User\.openclaw\workspace\broker-in-a-box
   npm run dev
   ```

3. **Open http://localhost:3000**

4. **Test the workflow:**
   - Sign in with Google
   - Click "Agency Agreements" in sidebar
   - Create a new Listing Agreement
     - Type: Listing Agreement
     - Client: John Seller
     - Property: 123 Main St, Provo, UT
     - Agent: (pick one)
     - Agreement Date: today
   - Click into that agency agreement
   - Click "Add Purchase Contract"
   - Notice it pre-fills:
     - Seller name (from the listing agreement)
     - Property address
     - Agent
     - Role: Listing Agent
   - Fill in buyer info
   - Create transaction
   - See the compliance checklist

## What's New

### Navigation
- "Agency Agreements" tab - list of listing agreements and buyer agency agreements
- "Transactions" tab - list of purchase contracts

### Agency Agreement Page
- Shows agreement details
- Shows list of related purchase contracts
- "Add Purchase Contract" button

### Transaction Form
- Now has "Your Role" field: Listing Agent / Buyer's Agent / Dual Agency
- When created from an agency, pre-fills seller or buyer info
- Buyer and Seller sections (not just "client")

### Transaction Types
- Purchase / Lease (what's happening with the property)
- Your Role: Listing Agent, Buyer's Agent, Dual Agency

## Real World Flow

1. Agent signs listing agreement → Create "Listing Agreement" in Agency Agreements
2. Buyer makes offer → Click agency → "Add Purchase Contract"
3. System pre-fills seller info from listing agreement
4. Add buyer info
5. Both sides tracked in one compliance file

## Still To Do

- Agency agreement compliance checklists (currently placeholder)
- Update transaction compliance templates to match new transaction types
- Gmail integration for auto-filing PDFs
- AI document classification

# REPC Dates & Sortable Transaction Table

**Status:** Built, ready to deploy

## What We Built

### 1. REPC Date Fields (Section 24 Deadlines)

Added proper REPC date tracking to transactions:

**Front Page:**
- `offer_reference_date` (required) - Primary date, when offer was made

**Section 24 Deadlines:**
- `seller_disclosure_deadline` (24(a))
- `due_diligence_deadline` (24(b))
- `finance_appraisal_deadline` (24(c))
- `settlement_deadline` (24(d), required) - When signing happens

**Important Distinctions:**
- **Settlement** = parties sign documents (Section 24.4 deadline)
- **Closing** = deed records, funds transfer (up to 4 days after settlement per Section 3.2)
- **Possession** = buyer gets keys (negotiated, Section 3.3)

**Closing is NOT a database field** - it's a process that happens ≤4 days after settlement.

**Transaction status stays "pending"** until deed is recorded, then becomes "closed".

### 2. Updated Transaction Form

Transaction create/edit forms now capture:
- Offer Reference Date (required, replaces old "contract_date")
- All four Section 24 deadlines
- Settlement Deadline (required)
- Helper text showing which REPC section each date comes from

### 3. Sortable Transaction Tables (Coming Next)

**Agent View:**
| Client ⬍ | Type ⬍ | Address ⬍ | Offer Date ⬍ | Settlement Deadline ⬍ | Status ⬍ |
|----------|--------|-----------|--------------|---------------------|----------|
| Smith, John | Buyer | 123 Main St | 12/01/2025 | 01/15/2026 | Pending |

**Broker View:**
| Agent ⬍ | Client ⬍ | Type ⬍ | Address ⬍ | Offer Date ⬍ | Settlement Deadline ⬍ | Status ⬍ |
|---------|----------|--------|-----------|--------------|---------------------|----------|
| Sarah T. | Smith, John | Buyer | 123 Main St | 12/01/2025 | 01/15/2026 | Pending |

**Features:**
- Click any column header to sort ascending/descending
- Both agent and broker views sortable
- Common use cases:
  - Sort by Settlement Deadline → see what's closing soon
  - Sort by Agent (broker view) → group by team member
  - Sort by Status → see all pending deals

## Files Changed

### Database
- `supabase/add-repc-dates.sql` - Migration adds 5 new date columns

### Transaction Form
- `app/dashboard/transactions/new/new-transaction-form.tsx` - Updated with REPC date fields

### Next Steps (Not Built Yet)
- Sortable table component for transaction list
- Search/filter interface
- Address autocomplete (from agent's own transaction history)

## Database Schema

```sql
ALTER TABLE transactions
ADD COLUMN offer_reference_date DATE,
ADD COLUMN seller_disclosure_deadline DATE,  -- Section 24(a)
ADD COLUMN due_diligence_deadline DATE,       -- Section 24(b)
ADD COLUMN finance_appraisal_deadline DATE,   -- Section 24(c)
ADD COLUMN settlement_deadline DATE;          -- Section 24(d)

-- Indexes for sorting/filtering
CREATE INDEX idx_transactions_settlement_deadline ON transactions(settlement_deadline);
CREATE INDEX idx_transactions_offer_reference_date ON transactions(offer_reference_date);
```

## Deployment Steps

### 1. Run Migration
```bash
# In Supabase SQL Editor, paste contents of:
supabase/add-repc-dates.sql
```

### 2. Deploy to Vercel
Already committed and pushed to GitHub. Vercel auto-deploys.

### 3. Test
1. Create new transaction
2. Verify REPC Dates section appears
3. Verify Offer Reference Date and Settlement Deadline are required
4. Verify optional deadlines can be left blank
5. Transaction should save with all dates

## Real Estate Context

**Why These Dates Matter:**

1. **Offer Reference Date** - Primary identifier, always exists first. Until you have a contract, this is the only date to go by.

2. **Section 24 Deadlines** - Critical compliance dates that happen during "pending" status:
   - 24(a): Seller must disclose property issues
   - 24(b): Buyer completes inspections (due diligence)
   - 24(c): Financing/appraisal must be approved
   - 24(d): Settlement signing must happen

3. **Settlement vs Closing** - Common confusion:
   - **Settlement** = signing happens (can be late Friday 4:30 PM)
   - **Closing** = recording happens (might be Tuesday if Monday is holiday)
   - REPC allows up to 4 calendar days between settlement and recording
   - Accounts for weekends + holidays

4. **Possession** - Separate from closing:
   - Can be same day as closing
   - Can be days/weeks after (seller needs time to move)
   - Can even be before closing (rent-back)
   - Negotiated between parties

## Business Value

**Agent Benefits:**
- Quickly see what deals are closing soon (sort by settlement deadline)
- Track all REPC deadlines in one place
- No more digging through PDFs to find dates

**Broker Benefits:**
- Scan entire team's pipeline sorted by urgency
- See which agents have deals closing this week/month
- Spot transactions approaching deadlines

**Compliance:**
- All REPC dates captured systematically
- Easy to generate reports for state audits
- Clear audit trail of transaction timeline

## Notes

- ✅ Form validates required dates (offer reference + settlement deadline)
- ✅ Optional deadlines can be blank (agents fill them in as available)
- ✅ Database indexes speed up sorting by date
- ⏳ Sortable table interface coming next
- ⏳ Address autocomplete coming after that

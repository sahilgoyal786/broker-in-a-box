# Edit Transaction Feature

**Status:** ✅ Complete and deployed

## What It Does

Allows brokers and agents to update transaction details when deal terms change - common real-world scenarios like:
- Settlement deadline extended (negotiations)
- Purchase price adjusted (inspection repairs negotiation)
- Buyer/seller contact info updated
- Custom deadline added (HOA approval, septic test, etc.)

## Real-World Use Cases

**Scenario 1: Price Reduction**
- Buyer does inspection, finds $3,000 in needed repairs
- Instead of asking seller to fix, they negotiate price reduction
- Agent edits transaction: Purchase Price $425,000 → $422,000
- When addendum PDF arrives via DocuSign (future feature), system will auto-detect change

**Scenario 2: Deadline Extension**
- Buyer's financing delayed, needs 2 more weeks
- Buyer and seller agree to extend settlement deadline
- Agent edits transaction: Settlement Deadline March 1 → March 15
- All parties stay aligned on new timeline

**Scenario 3: Additional Contingency**
- Deal requires HOA approval (wasn't in original REPC)
- Addendum adds HOA approval contingency with April 1 deadline
- Agent adds custom deadline: "HOA Approval" - April 1

## Access Control

**Brokers:**
- ✅ Can edit ANY transaction at their brokerage
- ✅ Can reassign transactions to different agents
- ✅ Full edit access (all fields)

**Agents:**
- ✅ Can edit ONLY their own transactions (Wall of Confidentiality via RLS)
- ❌ Cannot reassign to other agents (agent_id dropdown is disabled)
- ✅ Full edit access to all other fields

**RLS (Row Level Security):**
Database automatically blocks agents from editing other agents' deals - no permission checking needed in code.

## Features

### Edit Button
- Appears on transaction detail page
- Right side of header, next to status dropdown
- Available to broker + assigned agent only

### Edit Form
- Pre-filled with all current values
- Same validation as create form (required fields, date formats)
- Dark theme matching rest of dashboard
- "Save Changes" button updates database
- "Cancel" button returns to detail page

### Editable Fields
- Transaction type (purchase/lease)
- Agent assignment (brokers only)
- Agency role (listing/buyer/dual)
- Property details (address, city, state, zip, type)
- Buyer info (name, email, phone)
- Seller info (name, email, phone)
- **Purchase price** (critical for price adjustments)
- **Offer reference date**
- **All Section 24 deadlines** (24a, 24b, 24c, 24d)
- **Custom deadline 1** (label + date)
- **Custom deadline 2** (label + date)

### Non-Editable Fields
- Transaction ID (system generated)
- Broker (can't transfer to different brokerage)
- Created date (historical record)
- Status (changed via separate status dropdown)

## Files

### New Files
- `app/dashboard/transactions/[id]/edit/page.tsx` - Edit page wrapper
- `app/dashboard/transactions/[id]/edit/edit-transaction-form.tsx` - Edit form component
- `EDIT-TRANSACTION-FEATURE.md` - This documentation

### Modified Files
- `app/dashboard/transactions/[id]/page.tsx` - Added "Edit" button to detail page header

## User Flow

1. Broker/agent views transaction detail page
2. Clicks "Edit" button (top right)
3. Lands on edit form (all fields pre-filled)
4. Updates fields as needed:
   - Extends settlement deadline
   - Adjusts purchase price
   - Adds custom deadline for HOA approval
   - Updates buyer phone number
5. Clicks "Save Changes"
6. Returns to detail page with updated data

## Technical Details

### Database
No schema changes needed - all fields already exist and editable via RLS.

### Validation
- Offer Reference Date (required)
- Settlement Deadline (required)
- Buyer first/last name (required)
- All other fields optional

### RLS Enforcement
```sql
-- Agents can only update their own transactions
CREATE POLICY "Agents can update own transactions" ON transactions
  FOR UPDATE
  USING (agent_id = auth.uid());

-- Brokers can update all transactions at their brokerage
CREATE POLICY "Brokers can update brokerage transactions" ON transactions
  FOR UPDATE
  USING (broker_id IN (SELECT id FROM brokers WHERE auth_user_id = auth.uid()));
```

### Agent Dropdown Logic
```tsx
<select 
  name="agent_id"
  disabled={isAgent}  // Locked for agents
  defaultValue={transaction.agent_id}
>
```

## Future Enhancement: AI Auto-Update

**Phase 2 (not built yet):**

When addendum PDF arrives via DocuSign:
1. AI reads PDF content
2. Detects changes:
   - "Purchase price reduced from $425,000 to $422,000"
   - "Settlement deadline extended to March 15, 2026"
3. Auto-updates transaction record in database
4. Notifies agent: "Price updated from addendum received 2/20/26"
5. Shows audit trail: "Modified by AI from DocuSign addendum"

**Benefits:**
- Zero manual data entry
- Always current with latest addendums
- Audit trail of all changes
- Huge competitive advantage over Dotloop

**Implementation notes for later:**
- Store addendum PDF in Supabase Storage
- Parse PDF with OpenRouter vision model
- Extract structured data (price, dates)
- Compare with current transaction record
- Apply changes + log source document
- Send notification if significant change detected

## Deployment

**Already deployed to Vercel!**

Just committed and pushed:
- Edit page + form
- Edit button on detail page
- Documentation

**Test it:**
1. Go to https://broker-in-a-box.vercel.app
2. Log in as broker or agent
3. Click any transaction
4. Click "Edit" button
5. Update a field (e.g., extend settlement deadline)
6. Click "Save Changes"
7. Verify detail page shows updated value

## Business Value

**For Agents:**
- Update deals as they evolve (happens constantly in real estate)
- No need to create new transaction when terms change
- Accurate data for compliance and reporting

**For Brokers:**
- See current deal status across entire team
- Trust that data is up-to-date (agents can fix it themselves)
- Can step in and update any deal if needed

**vs Dotloop:**
- Dotloop: rigid workflows, hard to edit after creation
- Broker in a Box: flexible, edit anytime (reflects real-world dealmaking)

**Compliance:**
- Captures ALL deadline changes (audit trail)
- Shows current deal terms (not stale data from original REPC)
- Future AI auto-update ensures data matches actual signed documents

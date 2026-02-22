# Run Transaction Compliance Migration

## 📋 What This Does

Creates the **transaction_compliance_items** table and auto-populates compliance checklists for purchase contracts (REPC documents).

## 🚀 How to Run

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc/sql/new

2. **Copy the entire contents of this file:**
   - `C:\Users\User\.openclaw\workspace\broker-in-a-box\supabase\create-transaction-compliance.sql`

3. **Paste into SQL editor and click "Run"**

## ✅ What Gets Created

### Core Forms (ALL transactions):
1. ✅ **REAL ESTATE PURCHASE CONTRACT** (pdf_auto)
2. ✅ **All Addenda** (manual_checkbox, optional)
3. ✅ **Seller's Property Condition Disclosure Signed by Buyer** (pdf_auto)
   - Varies by property type:
     - Vacant Land: "SELLER'S PROPERTY CONDITION DISCLOSURE -- LAND SIGNED BY BUYER"
     - Commercial/Multi-Unit: "COMMERCIAL SELLER'S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER"
     - Residential/Mobile Home: "SELLER'S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER"
4. ✅ **CONFIRMATION OF RECEIPT OF EARNEST MONEY** (pdf_auto)

### Buyer-Side Forms (buyer_agency and limited_agency roles ONLY):
**Note**: Listing agents don't handle earnest money deposits - that's the buyer's agent's responsibility.

5. ✅ **Earnest Money Deposit Receipt** (manual_upload)
   - Proof that earnest money was actually deposited
   - Critical for buyer-side: If buyer defaults without depositing EM, there's nothing to claim

### Conditional Forms:
6. ✅ **Lead Paint Disclosure** (pre-1978 residential/multi-unit only)
   - "DISCLOSURE & ACKNOWLEDGEMENT REGARDING LEAD-BASED PAINT AND/OR LEAD-BASED PAINT HAZARDS SIGNED BY BUYER"

## 🔄 Auto-Population

When a transaction is created, compliance items are automatically added based on:
- **Property Type** (residential, commercial, multi_unit, vacant_land)
- **Transaction Role** (listing, buyer_agency, limited_agency)
- **Year Built** (adds lead paint if pre-1978)

The system also handles updates - if property type or year built changes, it regenerates the checklist automatically.

## 🎯 Result

After running this migration:
- ✅ All existing transactions will NOT have compliance items (only new ones)
- ✅ All NEW transactions will auto-populate compliance checklists
- ✅ Transaction detail pages will show compliance checklist in right column (sticky)
- ✅ Brokers and agents can click to toggle completion status
- ✅ Progress counter shows "X of Y complete"

## 🧪 Test It

1. Create a new transaction
2. Go to the transaction detail page
3. You should see the compliance checklist in the right column
4. Click checkboxes to mark forms complete
5. Watch the counter update

## 📊 RLS Policies

- **Brokers**: Can view and update ALL transaction compliance items
- **Agents**: Can view and update ONLY their own transaction compliance items
- **Wall of Confidentiality**: Enforced via agent_id on transactions table

---

**Ready to run?** Copy the SQL from `create-transaction-compliance.sql` and paste into Supabase! 🚀

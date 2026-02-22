# ✅ FIXED Migration - Run This

## What Was Wrong
1. ❌ `transaction_role` → ✅ Fixed to `transaction_type`
2. ❌ Referenced `year_built` field that doesn't exist yet → ✅ Removed (we'll add later)

## How to Run

### Step 1: Clear Previous Migration
Run this first to clean up:
```sql
DROP TABLE IF EXISTS transaction_compliance_items CASCADE;
DROP FUNCTION IF EXISTS populate_transaction_compliance() CASCADE;
DROP FUNCTION IF EXISTS update_transaction_compliance() CASCADE;
```

### Step 2: Run The Fixed Migration
Copy the entire contents of:
**`C:\Users\User\.openclaw\workspace\broker-in-a-box\supabase\create-transaction-compliance.sql`**

### Step 3: Paste and Run
1. Go to: https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc/sql/new
2. Paste the SQL
3. Click **"Run"**

### Step 4: Test
Create a new transaction and verify the compliance checklist appears!

---

## What You'll See

**Listing role** (4 forms):
1. REAL ESTATE PURCHASE CONTRACT ✅ Required
2. All Addenda (optional)
3. Seller's Property Condition Disclosure Signed by Buyer ✅ Required
4. CONFIRMATION OF RECEIPT OF EARNEST MONEY ✅ Required

**Buyer role** (5 forms):
1-4: Same as above, PLUS:
5. Earnest Money Deposit Receipt ✅ Required

**Limited Agency** (5 forms):
Same as buyer role

**Property type variations:**
- Vacant Land: "SELLER'S PROPERTY CONDITION DISCLOSURE -- LAND SIGNED BY BUYER"
- Commercial/Multi-Unit: "COMMERCIAL SELLER'S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER"
- Residential/Mobile Home: "SELLER'S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER"

---

## Future Enhancement
Later we'll add:
- `year_built` field to transactions
- Lead paint disclosure (pre-1978 residential/multi-unit)

For now, this gets you a working compliance checklist! 🚀

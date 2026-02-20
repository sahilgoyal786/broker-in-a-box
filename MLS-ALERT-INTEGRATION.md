# MLS Alert Auto-Integration

**Game-changer feature:** Automatically create and track listings via MLS email alerts (zero API needed)

## How It Works

### Broker Setup (One Time, 2 Minutes)
1. Log into their MLS system
2. Create a listing alert for their company name
3. Set alert to trigger on ANY status change (new, pending, under contract, closed, cancelled, expired)
4. Set delivery email to their dedicated transaction Gmail (e.g., `transactions@smithrealty.com`)
5. Done.

### AI Automation (Broker in a Box Backend)
1. **Monitor the transaction inbox** (Gmail API polling or push notifications)
2. **Identify MLS alert emails** (pattern matching on subject/sender)
3. **Parse listing data** from email:
   - MLS number
   - Property address
   - List price
   - Listing agent name
   - Status (Active, Pending, Under Contract, Closed, Cancelled, Expired)
   - Listing date / status change date
4. **Auto-create or update records:**
   - **New listing** → Create listing_agreement record
   - **Under contract** → Create transaction (REPC) linked to listing
   - **Closed** → Update transaction status to closed
   - **Cancelled/Expired** → Mark listing inactive

## Why This Crushes Traditional Compliance Software
- **Zero manual entry** - Broker lists property in MLS → system knows
- **No expensive MLS API** - Uses free email alerts every MLS already has
- **Works with ALL MLSs** - UtahRealEstate.com, Flex, Matrix, etc.
- **One alert per brokerage** - Not per agent (scales effortlessly)
- **Real-time updates** - Alert arrives → system updates within 2-5 minutes

## Example MLS Alert Email (UtahRealEstate.com)

```
Subject: Listing Alert - New Active Listing
From: alerts@utahrealestate.com

Company: Smith Realty
MLS#: 1234567
Address: 123 Main St, Provo, UT 84604
List Price: $450,000
Listing Agent: Jane Doe
Status: Active
List Date: 02/19/2026
```

## Parsing Logic
- Extract MLS# → unique identifier
- Check if listing_agreement exists with that MLS#
  - If no → Create new listing_agreement
  - If yes → Update status
- If status = "Under Contract" AND no transaction exists → Create transaction linked to listing
- If status = "Closed" AND transaction exists → Update transaction.status = 'closed'

## Fallback for Missing Agent Match
If alert shows "Jane Doe" but we don't have an agent named Jane Doe:
1. Create listing as **unassigned**
2. Send notification to broker: "New listing needs agent assignment"
3. Broker clicks → assigns to correct agent (maybe different spelling, maiden name, etc.)

## Phase 2: Buyer-Side Alerts
Some MLSs allow "saved search" alerts (e.g., "Alert me when any property goes pending in Provo").
- Broker creates saved search for their city/market
- Alert fires when listing goes pending
- AI checks: Is this one of our buyer's agents?
- If yes → Might be our buyer-side deal (requires confirmation)

For now: **Listing-side only** (more reliable, less noise)

## Technical Implementation

### Email Monitoring Options
1. **Gmail API polling** (every 5-15 min via heartbeat or cron)
2. **Gmail push notifications** (instant, requires pub/sub setup)
3. Start with polling (simpler), upgrade to push later

### Database Changes Needed
- Add `mls_number` field to `agency_agreements` table (VARCHAR, indexed)
- Add `auto_created` boolean flag (so broker knows it came from MLS, not manual entry)
- Add `last_mls_sync` timestamp to track freshness

### Email Parser
- Pattern match common MLS alert formats (UtahRealEstate.com first, expand later)
- Extract key fields with regex
- Create structured data object
- Upsert to database

### Edge Cases
- **Duplicate alerts** (MLS sends same alert twice) → Check MLS# + timestamp, ignore duplicates
- **Agent name mismatch** → Fuzzy match first, fallback to unassigned
- **Co-listings** (two agents on one listing) → Create for primary agent, note co-agent in description

## Competitive Advantage
Traditional real estate brokers use:
- **Spreadsheets** (manual entry hell)
- **Paper files** (lost documents, missed deadlines)
- **Expensive broker software** ($200-500/month, requires manual entry)

Broker in a Box:
- **$50/month** (or whatever pricing)
- **Zero manual entry** for listings
- **Auto-tracks compliance** from MLS alerts
- **2-minute setup**

**Sales pitch:** "Set up one MLS alert. We'll track every listing automatically. $50/month. Try it free for 14 days."

## Build Order (This Weekend)
1. ✅ Database schema (add mls_number, auto_created fields)
2. ✅ Gmail API integration (already have OAuth setup)
3. ✅ Email parser (start with UtahRealEstate.com format)
4. ✅ Auto-create listing logic
5. ✅ Auto-create transaction on "Under Contract" status
6. ✅ Broker notification system (when unassigned listing needs attention)
7. ✅ Settings page: "Connect MLS Alerts" with instructions

## Revenue Impact
This single feature could be the entire marketing message:
- Landing page: "Your MLS already tracks your listings. Let us track compliance automatically."
- Video demo: Show MLS alert email → 30 seconds later → listing appears in system
- Testimonial: "I haven't manually entered a listing in 6 months."

**Ship this weekend.** This is the hook.

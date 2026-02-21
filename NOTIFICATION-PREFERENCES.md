# Notification Preferences - Complete Feature

**Status:** ✅ Built, ready to deploy

## What It Does

Gives brokers control over how they want to be notified about team activity, balancing legal oversight requirements with practical business needs.

## Broker Options

### 1. Real-Time Email Alerts
- Email immediately when agents create/update transactions
- **Use case:** New brokers, high-risk situations, tight oversight
- **Volume:** High (every transaction event)

### 2. Daily Digest Email
- One summary email per day with all activity
- **Use case:** Established teams, moderate oversight
- **Volume:** 1 email/day

### 3. Exception-Based Alerts (Recommended, Default)
- Only notified about compliance issues:
  - Missing required documents (4+ days)
  - License expiring (<45 days)
  - Transactions stuck in pending_closure (>7 days)
- **Use case:** Most brokers (legal oversight without micromanaging)
- **Volume:** Low (only when problems arise)

### 4. Dashboard Only
- No emails at all
- Broker logs in when they want to check
- **Use case:** Hands-off, experienced teams
- **Volume:** Zero emails

## User Experience

### New Broker Flow
1. Signs in with Google OAuth
2. System creates broker account
3. **Redirected to onboarding page** (new!)
4. Chooses notification preference
5. Clicks "Continue to Dashboard"
6. Lands on main dashboard

### Existing Broker
- Settings → Notifications section
- Radio buttons to change preference
- Save button
- Can change anytime

## Files Changed

### Database
- `supabase/add-notification-preferences.sql` - Migration to add column

### Onboarding
- `app/dashboard/onboarding/page.tsx` - New onboarding page
- `app/dashboard/onboarding/notification-preference.tsx` - Onboarding UI

### Settings
- `app/dashboard/settings/page.tsx` - Added notification_preference to query
- `app/dashboard/settings/settings-form.tsx` - Added notifications section

### Auth
- `app/auth/callback/route.ts` - Redirects new brokers to onboarding

## Database Schema

```sql
ALTER TABLE brokers 
ADD COLUMN notification_preference TEXT DEFAULT 'exception_based'
CHECK (notification_preference IN ('real_time', 'daily_digest', 'exception_based', 'dashboard_only'));
```

## Deployment Steps

### 1. Run Migration
```bash
# In Supabase SQL Editor
\i supabase/add-notification-preferences.sql
```

### 2. Deploy to Vercel
```bash
git add .
git commit -m "Add notification preferences onboarding and settings"
git push origin main
```

Vercel auto-deploys from GitHub.

### 3. Test
1. Create new test broker account with different Google email
2. Should land on onboarding page after OAuth
3. Select preference, click Continue
4. Should land on dashboard
5. Go to Settings → verify preference is saved and editable

## Future Enhancements

When we build email notifications (later phase):

1. **Real-time alerts** → Send email immediately from transaction create/update API
2. **Daily digest** → Cron job at 8am, queries yesterday's activity, sends summary
3. **Exception-based** → Check conditions on transaction updates, send if threshold met
4. **Dashboard only** → No email sending code runs

## Business Value

**Reduces onboarding friction:**
- Broker picks preference once, doesn't think about it again
- Settings page makes it easy to change later
- Defaults to "exception_based" (smart middle ground)

**Competitive advantage:**
- Dotloop: one-size-fits-all notifications (annoying)
- Broker in a Box: broker controls the flow (respects their business model)

**Aligns with legal requirements:**
- All options give broker visibility (legal compliance)
- Method of delivery is broker's choice (business preference)
- Exception-based hits sweet spot (oversight without micromanaging)

## Notes

- ✅ No external dependencies (no email service needed yet)
- ✅ Works immediately (just saves preference to database)
- ✅ Sets up infrastructure for future email notification system
- ✅ Reduces support questions ("How do I change notifications?")

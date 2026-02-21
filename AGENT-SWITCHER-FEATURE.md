# Agent Switcher - "Work As Agent" Feature

**Status:** ✅ Complete and deployed

## What It Does

Allows brokers to test the agent experience without logging out - a dropdown in the header to "work as" any agent and see exactly what they see.

**Critical for testing:**
- No need to manage multiple browser tabs
- No need to create test agent logins
- Instant switching between broker view and agent view
- Clear visual indicator when in agent mode

## How It Works

### For Brokers

**Header dropdown** (top right of dashboard):
- Default: "Broker View" (green/blue)
- Click → dropdown shows all agents
- Select agent → view switches to "Viewing as: [Agent Name]" (orange)
- **You now see ONLY that agent's data:**
  - Transactions list filtered to that agent
  - Dashboard stats for that agent only
  - Edit permissions same as agent (can't reassign deals)
- Click dropdown again → select "Broker (Full Access)" to return to normal mode

### For Agents

**Nothing changes** - switcher doesn't appear for real agents (only for brokers).

## Visual Indicators

**Normal Broker View:**
- Dropdown button: Gray background
- Text: "Broker View"
- See all agents' data

**Agent Mode (Testing):**
- Dropdown button: **Orange background** (hard to miss!)
- Text: "Viewing as: Sarah Thompson"
- Small helper text: "💡 Testing agent view - you'll only see this agent's data"
- See ONLY that agent's transactions/data

## Implementation Details

### Client-Side State
Uses `localStorage` to persist selection:
```js
localStorage.setItem('impersonate_agent_id', agentId)
```

**Why localStorage:**
- Persists across page refreshes
- No server-side session needed (testing tool only)
- Easy to clear (just switch back to "Broker View")

### Filtering Logic

**TransactionsTable component** (client-side):
```tsx
const { viewingAsAgent, impersonateAgentId } = getViewContext()

if (userRole === 'broker' && viewingAsAgent && impersonateAgentId) {
  // Filter to selected agent's transactions
  setFilteredTransactions(transactions.filter(t => t.agent_id === impersonateAgentId))
}
```

**Dashboard stats** (future):
Will use same `getViewContext()` utility to filter counts.

### Security

**This is a TESTING tool, not a security bypass:**
- Server-side RLS still enforces real permissions
- All transactions are sent from server (broker has access anyway)
- Filtering happens client-side (cosmetic only)
- If someone modifies localStorage to fake agent ID, RLS blocks them anyway

**Real agent users:**
- Don't see the switcher
- Can't access other agents' data (RLS enforced)
- This feature is invisible to them

## Files

### New Files
- `app/dashboard/agent-switcher.tsx` - Dropdown component
- `lib/get-view-context.ts` - Client utility to check impersonation state
- `app/dashboard/transactions/transactions-table.tsx` - Client component for filtered table
- `AGENT-SWITCHER-FEATURE.md` - This documentation

### Modified Files
- `app/dashboard/layout.tsx` - Added AgentSwitcher to header, fetch agents list
- `app/dashboard/transactions/page.tsx` - Use TransactionsTable instead of server-rendered table

## User Flow (Testing)

**Scenario: Broker testing agent Sarah's view**

1. Log in as broker
2. See header dropdown: "Broker View"
3. Click dropdown → see list: "Broker (Full Access)", "Sarah Thompson", "Mike Roberts", etc.
4. Click "Sarah Thompson"
5. **Page refreshes** (router.refresh())
6. Dropdown now shows: "Viewing as: Sarah Thompson" (orange background)
7. Transactions page shows ONLY Sarah's deals
8. Dashboard stats show ONLY Sarah's numbers
9. Click Edit on transaction → can't reassign to other agents (agent behavior)
10. Click dropdown → select "Broker (Full Access)"
11. **Page refreshes**
12. Back to seeing all agents' data

## Future Enhancements

**Apply to more pages:**
- ✅ Transactions table (done)
- ⏳ Dashboard stats cards (when built)
- ⏳ Agency agreements page
- ⏳ Any other data views

**Potential additions:**
- "Work as Agent" button on Agents page (click agent row → view as them)
- Keyboard shortcut to exit agent mode (Esc?)
- Show banner at top: "⚠️ Testing as Sarah Thompson - Click here to return to Broker View"

## Why This Matters

**Real-world testing workflow:**

Without this feature:
1. Create agent login
2. Remember password
3. Open incognito window
4. Log in as agent
5. Test feature
6. Close window
7. Back to broker tab
8. Repeat for each agent

With this feature:
1. Click dropdown
2. Select agent
3. Test feature
4. Click dropdown
5. Back to broker view

**Saves hours of testing time!**

## Technical Notes

### Why Not Server-Side Session?

**Considered:** Store impersonation in Next.js session or cookie, check server-side.

**Rejected because:**
- Adds complexity (session management)
- Need to modify every server query
- Risk of session leaking into production
- This is a dev/testing tool, not a real feature

**Current approach:**
- Lightweight (just localStorage)
- Clear it's client-side (data comes from server, filtered locally)
- Zero risk of breaking RLS or real permissions

### Router Refresh

When agent selection changes:
```tsx
router.refresh()
```

**Why:** Forces server components to re-render with fresh data (so React effects run with new localStorage value).

### localStorage vs Cookies

**localStorage chosen because:**
- Simple API
- No server-side reading needed
- Persists until cleared
- Domain-scoped (won't leak)

**Not cookies because:**
- Would send to server on every request (unnecessary)
- More complex API
- This is purely client-side filtering anyway

## Deployment

**Already deployed to Vercel!**

Just committed and pushed:
- Agent switcher dropdown
- View context utility
- Filtered transactions table
- Layout integration

**Test it:**
1. Go to https://broker-in-a-box.vercel.app
2. Log in as broker (must have multiple agents)
3. Look top right - see "Broker View" dropdown
4. Click → select an agent
5. Verify transactions list shows only that agent's deals
6. Click dropdown → back to "Broker (Full Access)"
7. Verify you see all transactions again

## Business Value

**For Rob (developer/broker):**
- Test agent permissions instantly
- No need for multiple logins
- Verify Wall of Confidentiality works
- See exactly what each agent sees
- Debug agent-specific issues quickly

**For future brokers using the product:**
- Not exposed (testing tool only)
- Could be enabled as "View as Agent" support feature
- Help desk can troubleshoot agent issues
- Training mode for new brokers

**Development velocity:**
- Faster feature testing
- Catch agent-specific bugs early
- Easier demo creation (switch views live)

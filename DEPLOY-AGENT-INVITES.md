# Deploy Agent Invite System - Simple Guide

## ✅ What Was Built

**Added "Invite Selected" button to your existing agents page!**

Your agents page already had:
- ✅ Checkboxes
- ✅ "Email Selected" button  
- ✅ "Update License Date" button

**Now it also has:**
- ✅ **"Invite Selected" button** (blue, at the front)
- ✅ **Status badge column** (Pending/Invited/Active)
- ✅ Invite system that generates unique links
- ✅ Password setup page for agents

---

## 🚀 Deploy in 3 Steps

### Step 1: Add Database Columns (2 minutes)

1. Go to https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc
2. Click **SQL Editor** (left sidebar)
3. Copy/paste this and click **Run**:

```sql
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS invite_token TEXT,
ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invite_status TEXT DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_agents_invite_token ON agents(invite_token);

UPDATE agents 
SET invite_status = 'pending' 
WHERE auth_user_id IS NULL;

UPDATE agents 
SET invite_status = 'active' 
WHERE auth_user_id IS NOT NULL;
```

### Step 2: Push to GitHub (30 seconds)

```bash
cd C:\Users\User\.openclaw\workspace\broker-in-a-box
git add -A
git commit -m "Add agent invite system"
git push
```

### Step 3: Wait for Vercel (1 minute)

Vercel auto-deploys. Check https://broker-in-a-box.vercel.app in 60 seconds.

---

## 📱 How It Works

### Broker Side:

1. **Upload CSV** with 25 agents
2. **Agents page shows all agents** with checkboxes
3. **Select 15 agents** you want to invite
4. **Click "Invite Selected"** button
5. System generates invite links and **logs to console** (email not implemented yet)
6. Status changes from **Pending** (yellow) → **Invited** (blue)

### Agent Side:

1. Clicks unique invite link: `/invite/abc123...`
2. Sees: "Welcome to Broker in a Box - [Broker Name] has invited you"
3. Sets password (8+ characters)
4. Clicks "Activate Account"
5. Status changes to **Active** (green)
6. Can now log in with email + password

---

## ⚠️ What's NOT Built Yet

**Email sending is a placeholder.** Right now it just logs to the server console.

**To actually send emails, you need:**
- Gmail API integration (30 min build)
- OR manually copy invite tokens from database

**For testing:**
1. Click "Invite Selected"
2. Check Vercel logs for invite tokens
3. Manually visit `/invite/[token]` to test password setup

---

## 🎨 What You'll See

### Agents Page (Broker View):

| ☑️ | Name | Email | **Status** | Core | Elective | ...
|---|------|-------|--------|------|----------|---
| ☑️ | Smith, John | john@... | 🟡 **Pending** | 9 | 9 | ...
| ☑️ | Doe, Jane | jane@... | 🔵 **Invited** | 12 | 6 | ...
| ☐ | Lee, Bob | bob@... | 🟢 **Active** | 18 | 3 | ...

**Bulk Actions Bar** (when agents checked):
```
3 agents selected
[🔵 Invite Selected] [🟣 Email Selected] [🟢 Update License Date]
```

### Invite Page (Agent View):

```
╔═══════════════════════════════════╗
║  Welcome to Broker in a Box       ║
║  Rob Aubrey has invited you       ║
╠═══════════════════════════════════╣
║  Setting up account for:          ║
║  John Smith                       ║
║  john@example.com                 ║
╠═══════════════════════════════════╣
║  Create Password:                 ║
║  [_______________]                ║
║                                   ║
║  Confirm Password:                ║
║  [_______________]                ║
║                                   ║
║  [Activate Account]               ║
╚═══════════════════════════════════╝
```

---

## 📁 Files Modified

**Existing file updated:**
- `app/dashboard/agents/agents-table.tsx` - Added invite button + status badges

**Existing file updated:**
- `app/dashboard/agents/page.tsx` - Include `invite_status` in query

**New files:**
- `app/api/agents/invite/route.ts` - Invite API endpoint
- `app/invite/[token]/page.tsx` - Public invite page
- `app/invite/[token]/invite-accept-form.tsx` - Password setup form
- `supabase/add-agent-invites.sql` - Database migration

**Documentation:**
- `AGENT-INVITE-SYSTEM.md` - Full technical docs
- `DEPLOY-AGENT-INVITES.md` - This file

---

## ✨ Next Step: Gmail Integration

**To make it actually send emails (30 min):**

We need to implement Gmail API in `/api/agents/invite/route.ts` line 80.

The broker's Google account is already connected (for Drive/Calendar), so we can use that to send invite emails.

**Want me to build that next?** Or test the manual flow first?

---

## 🧪 Quick Test (Without Email)

1. Deploy the code (3 steps above)
2. Go to broker-in-a-box.vercel.app/dashboard/agents
3. Upload a test CSV with 2 agents
4. Check both agents
5. Click "Invite Selected"
6. Check browser console / Vercel logs for invite tokens
7. Copy a token
8. Visit `broker-in-a-box.vercel.app/invite/[paste-token-here]`
9. Set password
10. Click "Activate Account"
11. Verify you can log in as that agent

---

**Ready to deploy? Run the 3 steps above!** 🚀

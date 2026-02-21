# Email Sending Setup - Resend

The invite system now uses **Resend** to send emails. It's simple, reliable, and has a generous free tier.

## 🎯 Why Resend?

- ✅ **100 emails/day free** (perfect for broker invites)
- ✅ **No complex OAuth** (just an API key)
- ✅ **Professional delivery** (great reputation)
- ✅ **2-minute setup**
- ✅ **Can use custom domain** (optional)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Sign Up for Resend

1. Go to: **https://resend.com/signup**
2. Sign up with your email (free account)
3. Verify your email

### Step 2: Get API Key

1. Once logged in, go to: **API Keys**
2. Click **"Create API Key"**
3. Name it: "Broker in a Box Production"
4. Click **Create**
5. **Copy the API key** (starts with `re_...`)

### Step 3: Add to Environment Variables

**Local Development** (`.env.local`):
```bash
RESEND_API_KEY=re_your_api_key_here
```

**Production** (Vercel):
1. Go to: https://vercel.com/aubrob/broker-in-a-box/settings/environment-variables
2. Add new variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_your_api_key_here`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
3. Click **Save**
4. **Redeploy** (or next git push will pick it up)

---

## 📧 How It Works

### Current Behavior (Without API Key)

If `RESEND_API_KEY` is not set:
- ✅ Invite system still works (generates tokens, updates database)
- ⚠️ Emails **log to console** instead of sending
- 📝 Console shows helpful setup instructions

### With API Key Configured

- ✅ Real emails sent via Resend
- ✅ Beautiful HTML email template
- ✅ From: "Your Broker Name <noreply@brokerinabox.com>"
- ✅ Professional delivery
- ✅ Logged to Vercel console for debugging

---

## 🎨 Email Template

The invite email includes:
- Personalized greeting with agent's name
- Broker name and branding
- Big blue "Activate My Account" button
- Unique invite link (copy-paste fallback)
- Professional footer
- Fully responsive HTML

**Subject**: `You've been invited to [Broker Name]'s Transaction Portal`

---

## 🔧 Testing

### Test Locally:

```bash
cd C:\Users\User\.openclaw\workspace\broker-in-a-box
npm run dev
```

1. Go to: http://localhost:3000/dashboard/agents
2. Select an agent (use your own email for testing)
3. Click **"Invite Selected"**
4. Check console:
   - Without API key: See logged email details
   - With API key: See "✅ Email sent successfully"

### Test in Production:

1. Push changes to GitHub
2. Wait for Vercel deploy (~60 seconds)
3. Go to: https://broker-in-a-box.vercel.app/dashboard/agents
4. Invite an agent with your email
5. Check your inbox!

---

## 📊 Resend Free Tier Limits

| Feature | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| Emails per day | 100 | 50,000+ |
| Emails per month | 3,000 | Unlimited |
| Custom domain | ✅ Yes | ✅ Yes |
| Analytics | ✅ Yes | ✅ Yes |
| Support | Email | Priority |

**For most brokers:** Free tier is more than enough!

If you invite 25 agents once = 25 emails used. You could do this **4 times per day** and stay under the limit.

---

## 🌐 Custom Domain (Optional)

Want emails to come from `invites@yourbrokerage.com`?

1. Add your domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC)
3. Update `.env.local`:
   ```bash
   RESEND_FROM_EMAIL=invites@yourbrokerage.com
   ```

**Note:** Default is `noreply@brokerinabox.com` which works perfectly fine!

---

## 🐛 Troubleshooting

### "Email not sent" message

**Cause:** `RESEND_API_KEY` not set in environment variables

**Fix:** 
1. Sign up for Resend
2. Get API key
3. Add to Vercel environment variables
4. Redeploy

### Emails going to spam

**Solution 1:** Use custom domain with proper DNS records  
**Solution 2:** Ask recipients to whitelist `noreply@brokerinabox.com`  
**Solution 3:** First email might go to spam, but not subsequent ones

### Rate limit exceeded

**Cause:** Sent more than 100 emails in 24 hours (free tier)

**Fix:** Wait 24 hours, or upgrade to paid plan ($20/month for 50,000/month)

---

## ✅ Next Steps

1. Sign up for Resend (2 min)
2. Add API key to Vercel (1 min)
3. Redeploy or push new code (1 min)
4. Test by inviting yourself (1 min)
5. 🎉 Start inviting agents!

---

**Questions?** Check Resend docs: https://resend.com/docs

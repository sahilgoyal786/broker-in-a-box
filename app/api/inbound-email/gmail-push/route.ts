import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { syncMailbox } from '@/lib/inbound/sync-mailbox'

export const maxDuration = 60

const oauthClient = new OAuth2Client()

/** Verify the OIDC token Pub/Sub attaches to push requests. */
async function isFromPubSub(request: Request): Promise<boolean> {
  const audience = process.env.INBOUND_PUSH_AUDIENCE
  const expectedEmail = process.env.INBOUND_PUSH_SERVICE_ACCOUNT
  if (!audience || !expectedEmail) {
    console.error('[gmail-push] INBOUND_PUSH_AUDIENCE / INBOUND_PUSH_SERVICE_ACCOUNT not set')
    return false
  }
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return false
  try {
    const ticket = await oauthClient.verifyIdToken({ idToken: token, audience })
    const payload = ticket.getPayload()
    return payload?.email === expectedEmail && payload?.email_verified === true
  } catch {
    return false
  }
}

// POST /api/inbound-email/gmail-push
// Pub/Sub push endpoint for the catch-all mailbox. The message body only says "something changed";
// we sync from the stored history cursor, so the payload contents are not trusted or needed.
export async function POST(request: Request) {
  if (!(await isFromPubSub(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await syncMailbox()
    return NextResponse.json({ ok: true, ...summary })
  } catch (err) {
    console.error('[gmail-push] sync failed', err)
    // Non-2xx makes Pub/Sub redeliver; the cursor was not advanced so nothing is lost.
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

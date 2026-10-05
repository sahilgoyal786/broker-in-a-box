import { NextResponse } from 'next/server'
import { renewWatch, syncMailbox } from '@/lib/inbound/sync-mailbox'

export const maxDuration = 60

// GET /api/cron/inbound-mailbox
// Vercel Cron (see vercel.json). Renews the Gmail watch (expires ~weekly) and runs a catch-up
// sweep in case any Pub/Sub push was missed. Vercel sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const watch = await renewWatch()
    const summary = await syncMailbox({ sweep: true })
    return NextResponse.json({ ok: true, watchExpiration: watch.expiration, ...summary })
  } catch (err) {
    console.error('[cron/inbound-mailbox] failed', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

import type { gmail_v1 } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGmail } from './gmail-client'
import { processGmailMessage, type ProcessResult } from './process-message'

export interface SyncSummary {
  processed: number
  unmatched: number
  duplicate: number
  failed: number
  historyId: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const admin = () => createAdminClient() as any

async function readState(): Promise<{ history_id: string | null; watch_expiration: string | null }> {
  const { data } = await admin().from('inbound_mailbox_state').select('*').eq('id', 1).maybeSingle()
  return data ?? { history_id: null, watch_expiration: null }
}

async function writeState(patch: { history_id?: string; watch_expiration?: string }) {
  await admin()
    .from('inbound_mailbox_state')
    .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() })
}

/** Gmail history ids are numeric strings that only grow; compare as BigInt. */
function maxHistory(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null
  if (!b) return a
  return BigInt(a) >= BigInt(b) ? a : b
}

/** (Re)start push notifications to Pub/Sub. Gmail expires watches after ~7 days. */
export async function renewWatch(gmail: gmail_v1.Gmail = getGmail()) {
  const topicName = process.env.INBOUND_PUBSUB_TOPIC
  if (!topicName) throw new Error('INBOUND_PUBSUB_TOPIC is not set')
  const res = await gmail.users.watch({
    userId: 'me',
    requestBody: { topicName, labelIds: ['INBOX'], labelFilterBehavior: 'INCLUDE' },
  })
  const state = await readState()
  await writeState({
    history_id: maxHistory(state.history_id, res.data.historyId) ?? undefined,
    watch_expiration: res.data.expiration
      ? new Date(Number(res.data.expiration)).toISOString()
      : undefined,
  })
  return res.data
}

async function processIds(gmail: gmail_v1.Gmail, ids: string[], summary: SyncSummary) {
  for (const id of ids) {
    try {
      const result: ProcessResult = await processGmailMessage(gmail, id)
      summary[result]++
    } catch (err) {
      summary.failed++
      console.error('[inbound] failed to process message', id, err)
    }
  }
}

/** Safety-net sweep: list recent inbox mail and process anything we have not seen. */
async function sweepRecent(gmail: gmail_v1.Gmail, newerThan: string, summary: SyncSummary) {
  let pageToken: string | undefined
  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `in:inbox newer_than:${newerThan}`,
      maxResults: 100,
      pageToken,
    })
    await processIds(gmail, (res.data.messages ?? []).map((m) => m.id as string), summary)
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)
}

/**
 * Process everything new since the stored history cursor.
 * Falls back to a recent-mail sweep when there is no cursor or Gmail has expired it.
 * Safe to run concurrently or repeatedly: message processing is idempotent.
 */
export async function syncMailbox(options: { sweep?: boolean } = {}): Promise<SyncSummary> {
  const gmail = getGmail()
  const summary: SyncSummary = { processed: 0, unmatched: 0, duplicate: 0, failed: 0, historyId: null }
  const state = await readState()
  const cursor = state.history_id

  if (cursor) {
    try {
      let pageToken: string | undefined
      let latest: string | null = cursor
      do {
        const res = await gmail.users.history.list({
          userId: 'me',
          startHistoryId: cursor,
          historyTypes: ['messageAdded'],
          labelId: 'INBOX',
          pageToken,
        })
        const ids = new Set<string>()
        for (const h of res.data.history ?? []) {
          for (const added of h.messagesAdded ?? []) {
            if (added.message?.id) ids.add(added.message.id)
          }
        }
        await processIds(gmail, [...ids], summary)
        latest = maxHistory(latest, res.data.historyId)
        pageToken = res.data.nextPageToken ?? undefined
      } while (pageToken)
      // Only advance the cursor if nothing failed, so failed messages are retried.
      if (summary.failed === 0 && latest) {
        await writeState({ history_id: latest })
        summary.historyId = latest
      }
    } catch (err) {
      const status = (err as { code?: number }).code
      if (status !== 404) throw err
      // Cursor too old: rebuild from a recent sweep and a fresh profile cursor.
      console.warn('[inbound] history cursor expired, sweeping recent mail')
      await sweepRecent(gmail, '7d', summary)
      const profile = await gmail.users.getProfile({ userId: 'me' })
      if (profile.data.historyId && summary.failed === 0) {
        await writeState({ history_id: profile.data.historyId })
        summary.historyId = profile.data.historyId
      }
    }
  } else {
    // First run: process the last couple of days, then start tracking from now.
    await sweepRecent(gmail, '2d', summary)
    const profile = await gmail.users.getProfile({ userId: 'me' })
    if (profile.data.historyId && summary.failed === 0) {
      await writeState({ history_id: profile.data.historyId })
      summary.historyId = profile.data.historyId
    }
  }

  if (options.sweep && cursor) await sweepRecent(gmail, '2d', summary)
  return summary
}

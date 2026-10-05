import type { gmail_v1 } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchMessage, type ParsedMessage } from './gmail-client'
import { collectRecipientCandidates } from './resolve-recipient'
import { detectEsignPlatform } from './esign'

export type ProcessResult = 'processed' | 'unmatched' | 'duplicate'

const FORWARDING_VERIFICATION_SENDER = 'forwarding-noreply@google.com'

/**
 * Attribute one catch-all message to a broker and store it. Idempotent on the Gmail message id.
 * All writes use the service-role client, so every row must carry the resolved broker_id.
 */
export async function processGmailMessage(gmail: gmail_v1.Gmail, messageId: string): Promise<ProcessResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const [{ data: existing }, { data: existingUnmatched }] = await Promise.all([
    admin.from('incoming_emails').select('id').eq('gmail_message_id', messageId).maybeSingle(),
    admin.from('inbound_unmatched').select('id').eq('gmail_message_id', messageId).maybeSingle(),
  ])
  if (existing || existingUnmatched) return 'duplicate'

  const msg = await fetchMessage(gmail, messageId)
  const candidates = collectRecipientCandidates(msg.headers)
  const receivedAt = msg.internalDate
    ? new Date(Number(msg.internalDate)).toISOString()
    : new Date().toISOString()

  const broker = await matchBroker(admin, candidates.map((c) => c.handle))

  if (!broker) {
    const { error } = await admin.from('inbound_unmatched').insert({
      gmail_message_id: msg.id,
      from_address: msg.from,
      subject: msg.subject,
      to_candidates: candidates,
      received_at: receivedAt,
    })
    if (error && error.code !== '23505') throw error
    return 'unmatched'
  }

  const { error } = await admin.from('incoming_emails').insert(buildRow(msg, broker, candidates, receivedAt))
  if (error) {
    if (error.code === '23505') return 'duplicate' // concurrent worker won the race
    throw error
  }
  return 'processed'
}

/** First candidate handle (in priority order) that belongs to a broker. */
async function matchBroker(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  handles: string[]
): Promise<string | null> {
  if (!handles.length) return null
  const { data } = await admin.from('brokers').select('id, inbound_handle').in('inbound_handle', handles)
  if (!data?.length) return null
  const byHandle = new Map<string, string>(data.map((b: { id: string; inbound_handle: string }) => [b.inbound_handle, b.id]))
  for (const h of handles) {
    const id = byHandle.get(h)
    if (id) return id
  }
  return null
}

function buildRow(
  msg: ParsedMessage,
  brokerId: string,
  candidates: unknown,
  receivedAt: string
) {
  const isForwardingVerification = msg.from.toLowerCase().includes(FORWARDING_VERIFICATION_SENDER)
  return {
    broker_id: brokerId,
    received_at: receivedAt,
    from_address: msg.from || '(unknown)',
    subject: msg.subject || '(no subject)',
    esign_platform: detectEsignPlatform(msg.from, msg.subject),
    attachment_count: msg.attachments.length,
    processed: false,
    transaction_id: null,
    gmail_message_id: msg.id,
    gmail_thread_id: msg.threadId,
    to_candidates: candidates,
    body_text: msg.bodyText,
    attachments: msg.attachments,
    auth_results: msg.authResults,
    // Gmail's forwarding-confirmation mail carries a code/link the broker needs to see.
    status: isForwardingVerification ? 'forwarding_verification' : 'received',
  }
}

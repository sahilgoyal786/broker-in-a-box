import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface InboundAttachment {
  filename: string
  content_type: string
  content: string // base64
}

interface InboundEmailPayload {
  from: string
  to: string
  subject: string
  attachments?: InboundAttachment[]
}

// POST /api/inbound-email
// Receives inbound email webhooks (from Postmark or similar).
// 1. Identifies broker by To address matching submission_address
// 2. Logs to incoming_emails table
// 3. For each PDF attachment, stub AI form identification (logged, not yet classified)
// 4. Returns 200 OK with receipt confirmation
export async function POST(request: Request) {
  let payload: InboundEmailPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { from, to, subject, attachments = [] } = payload

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing required fields: from, to' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  // 1. Find broker by submission_address matching the To field
  const toAddress = to.toLowerCase().trim()
  const { data: broker, error: brokerError } = await supabase
    .from('brokers')
    .select('id, name')
    .eq('submission_address', toAddress)
    .single() as { data: { id: string; name: string } | null; error: Error | null }

  if (brokerError || !broker) {
    // No matching broker — log and return 200 anyway (so the sender doesn't retry)
    console.warn('[inbound-email] No broker found for submission_address:', toAddress)
    return NextResponse.json({
      received: true,
      matched_broker: false,
      attachments_count: attachments.length,
    })
  }

  // 2. Log to incoming_emails table
  const pdfAttachments = attachments.filter((a: InboundAttachment) =>
    a.content_type === 'application/pdf' ||
    a.filename?.toLowerCase().endsWith('.pdf')
  )

  const { data: emailRecord, error: insertError } = await supabase
    .from('incoming_emails')
    .insert({
      broker_id: broker.id,
      received_at: new Date().toISOString(),
      from_address: from,
      subject: subject ?? '(no subject)',
      attachment_count: attachments.length,
      processed: false,
      transaction_id: null,
      esign_platform: detectEsignPlatform(from, subject),
    })
    .select('id')
    .single() as { data: { id: string } | null; error: Error | null }

  if (insertError) {
    console.error('[inbound-email] Failed to insert incoming_email:', insertError)
    // Still return 200 to prevent retries
    return NextResponse.json({ received: true, error: 'DB insert failed' })
  }

  // 3. Stub: For each PDF attachment, log that we would classify it
  // TODO: Replace with actual AI form identification
  for (const attachment of pdfAttachments as InboundAttachment[]) {
    console.log('[inbound-email] PDF to classify:', {
      email_id: emailRecord?.id,
      broker_id: broker.id,
      filename: attachment.filename,
      // In future: call AI service to identify form type
    })
  }

  return NextResponse.json({
    received: true,
    matched_broker: true,
    broker_id: broker.id,
    email_id: emailRecord?.id,
    attachments_count: attachments.length,
    pdf_count: pdfAttachments.length,
  })
}

function detectEsignPlatform(from: string, subject: string | undefined): string | null {
  const combined = `${from} ${subject ?? ''}`.toLowerCase()
  if (combined.includes('docusign')) return 'docusign'
  if (combined.includes('dotloop')) return 'dotloop'
  if (combined.includes('authentisign')) return 'authentisign'
  if (combined.includes('skyslope')) return 'skyslope'
  return null
}

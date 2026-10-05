import { google, type gmail_v1 } from 'googleapis'
import type { HeaderPair } from './resolve-recipient'

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
const MAX_BODY_CHARS = 20000

export interface ParsedAttachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

export interface ParsedMessage {
  id: string
  threadId: string
  internalDate: string | null
  headers: HeaderPair[]
  from: string
  subject: string
  bodyText: string
  attachments: ParsedAttachment[]
  authResults: string | null
}

function loadServiceAccount(): { client_email: string; private_key: string } {
  const raw = process.env.INBOUND_GMAIL_SA_JSON
  if (!raw) throw new Error('INBOUND_GMAIL_SA_JSON is not set')
  // Accept raw JSON or base64-encoded JSON (easier to store in Vercel env vars).
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  const creds = JSON.parse(text)
  if (!creds.client_email || !creds.private_key) throw new Error('Invalid service account JSON')
  return creds
}

export function inboundMailbox(): string {
  const user = process.env.INBOUND_GMAIL_USER
  if (!user) throw new Error('INBOUND_GMAIL_USER is not set')
  return user
}

/** Gmail client impersonating the catch-all mailbox via domain-wide delegation. */
export function getGmail(): gmail_v1.Gmail {
  const creds = loadServiceAccount()
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
    subject: inboundMailbox(),
  })
  return google.gmail({ version: 'v1', auth })
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

function stripHtml(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function walkParts(
  part: gmail_v1.Schema$MessagePart | undefined,
  acc: { text: string[]; html: string[]; attachments: ParsedAttachment[] }
) {
  if (!part) return
  const mime = part.mimeType ?? ''
  if (part.filename && part.body?.attachmentId) {
    acc.attachments.push({
      filename: part.filename,
      mimeType: mime,
      size: part.body.size ?? 0,
      attachmentId: part.body.attachmentId,
    })
  } else if (part.body?.data) {
    if (mime === 'text/plain') acc.text.push(decodeBase64Url(part.body.data))
    else if (mime === 'text/html') acc.html.push(decodeBase64Url(part.body.data))
  }
  for (const child of part.parts ?? []) walkParts(child, acc)
}

export function parseMessage(msg: gmail_v1.Schema$Message): ParsedMessage {
  const headers: HeaderPair[] = (msg.payload?.headers ?? [])
    .filter((h) => h.name && h.value != null)
    .map((h) => ({ name: h.name as string, value: h.value as string }))
  const header = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name)?.value ?? ''

  const acc = { text: [] as string[], html: [] as string[], attachments: [] as ParsedAttachment[] }
  walkParts(msg.payload ?? undefined, acc)
  const body = acc.text.length ? acc.text.join('\n') : stripHtml(acc.html.join('\n'))

  return {
    id: msg.id as string,
    threadId: msg.threadId as string,
    internalDate: msg.internalDate ?? null,
    headers,
    from: header('from'),
    subject: header('subject'),
    bodyText: body.slice(0, MAX_BODY_CHARS),
    attachments: acc.attachments,
    authResults: header('authentication-results').slice(0, 1000) || null,
  }
}

export async function fetchMessage(gmail: gmail_v1.Gmail, id: string): Promise<ParsedMessage> {
  const res = await gmail.users.messages.get({ userId: 'me', id, format: 'full' })
  return parseMessage(res.data)
}

/** Download one attachment's bytes (used by later filing/Drive steps). */
export async function fetchAttachment(
  gmail: gmail_v1.Gmail,
  messageId: string,
  attachmentId: string
): Promise<Buffer> {
  const res = await gmail.users.messages.attachments.get({ userId: 'me', messageId, id: attachmentId })
  return Buffer.from((res.data.data ?? '').replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

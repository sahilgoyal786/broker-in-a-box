import { INBOUND_DOMAIN } from './constants'

export interface HeaderPair {
  name: string
  value: string
}

export interface RecipientCandidate {
  address: string
  handle: string
  source: string
}

// Highest priority first. Forwarded mail keeps the original To (the agent's own address),
// so the alias we gave the broker usually shows up in delivery/forwarding headers instead.
const HEADER_PRIORITY = [
  'delivered-to',
  'x-forwarded-to',
  'x-original-to',
  'envelope-to',
  'x-envelope-to',
  'to',
  'cc',
  'bcc',
  'x-forwarded-for',
  'x-gm-original-to',
]

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi

function extractAddresses(value: string): string[] {
  return (value.match(EMAIL_RE) ?? []).map((a) => a.toLowerCase())
}

/** Pull "for <addr>" recipients out of a Received header. */
function receivedForAddresses(value: string): string[] {
  const m = value.match(/\bfor\s+<?([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})>?/i)
  return m ? [m[1].toLowerCase()] : []
}

/** "acme+deals@brokercommandcenter.com" -> "acme"; null if not on our domain. */
export function handleFromAddress(address: string): string | null {
  const [local, domain] = address.toLowerCase().split('@')
  if (!local || domain !== INBOUND_DOMAIN) return null
  const handle = local.split('+')[0]
  return handle || null
}

/** Ordered, de-duplicated list of addresses on our domain found anywhere in the message headers. */
export function collectRecipientCandidates(headers: HeaderPair[]): RecipientCandidate[] {
  const out: RecipientCandidate[] = []
  const seen = new Set<string>()

  const add = (address: string, source: string) => {
    const handle = handleFromAddress(address)
    if (!handle || seen.has(handle)) return
    seen.add(handle)
    out.push({ address, handle, source })
  }

  for (const name of HEADER_PRIORITY) {
    for (const h of headers) {
      if (h.name.toLowerCase() !== name) continue
      for (const a of extractAddresses(h.value)) add(a, name)
    }
  }
  for (const h of headers) {
    if (h.name.toLowerCase() !== 'received') continue
    for (const a of receivedForAddresses(h.value)) add(a, 'received')
  }
  return out
}

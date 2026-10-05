import { createAdminClient } from '@/lib/supabase/admin'

export const INBOUND_DOMAIN = 'brokercommandcenter.com'

const RESERVED_HANDLES = new Set([
  'admin', 'administrator', 'support', 'help', 'info', 'contact', 'sales', 'billing',
  'noreply', 'noreplies', 'postmaster', 'abuse', 'security', 'webmaster', 'hostmaster',
  'root', 'mail', 'mailer', 'daemon', 'users', 'user', 'team', 'hello', 'api', 'www',
  'brokercommandcenter', 'bcc', 'test',
])

const MAX_HANDLE_LENGTH = 40
const MIN_HANDLE_LENGTH = 3

export function inboundAddressFor(handle: string): string {
  return `${handle}@${INBOUND_DOMAIN}`
}

/** "Acme Realty, LLC" -> "acmerealty". Keeps entity words so "Acme Realty" and "Acme Realty LLC" collide predictably. */
export function slugifyBrokerageName(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, MAX_HANDLE_LENGTH - 4) // leave room for a collision suffix
  return slug
}

export function isValidHandle(handle: string): boolean {
  return (
    /^[a-z0-9]+$/.test(handle) &&
    handle.length >= MIN_HANDLE_LENGTH &&
    handle.length <= MAX_HANDLE_LENGTH &&
    !RESERVED_HANDLES.has(handle)
  )
}

/** Pick a free handle for a brokerage name, appending a number on collision or if reserved/too short. */
export async function generateUniqueHandle(name: string): Promise<string> {
  let base = slugifyBrokerageName(name)
  if (base.length < MIN_HANDLE_LENGTH) base = `${base}broker`
  if (RESERVED_HANDLES.has(base)) base = `${base}1`

  const admin = createAdminClient()
  const candidates = [base, ...Array.from({ length: 50 }, (_, i) => `${base}${i + 2}`)]

  const { data: taken } = await admin
    .from('brokers')
    .select('inbound_handle')
    .in('inbound_handle', candidates)

  const used = new Set((taken ?? []).map((r: any) => r.inbound_handle))
  const free = candidates.find((c) => !used.has(c) && isValidHandle(c))
  if (!free) throw new Error('Could not allocate an inbound handle')
  return free
}

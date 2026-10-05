import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateUniqueHandle, inboundAddressFor } from '@/lib/inbound/handle'

/**
 * Creates the broker's @brokercommandcenter.com forwarding address from their brokerage name.
 * Idempotent: if a handle already exists it is returned unchanged (handles are immutable here).
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const brokerageName = typeof body.brokerageName === 'string' ? body.brokerageName.trim() : ''
  if (brokerageName.length < 2 || brokerageName.length > 120) {
    return NextResponse.json({ error: 'Enter your brokerage name' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: broker } = await admin
    .from('brokers')
    .select('id, inbound_handle')
    .eq('auth_user_id', user.id)
    .single()
  if (!broker) return NextResponse.json({ error: 'Broker not found' }, { status: 404 })

  if ((broker as any).inbound_handle) {
    return NextResponse.json({ address: inboundAddressFor((broker as any).inbound_handle) })
  }

  // Retry on the rare race where two signups claim the same handle.
  for (let attempt = 0; attempt < 3; attempt++) {
    const handle = await generateUniqueHandle(brokerageName)
    const { error } = await (admin.from('brokers') as any)
      .update({
        brokerage_name: brokerageName,
        inbound_handle: handle,
        submission_address: inboundAddressFor(handle),
      })
      .eq('id', (broker as any).id)
      .is('inbound_handle', null)

    if (!error) return NextResponse.json({ address: inboundAddressFor(handle) })
    if (error.code !== '23505') {
      console.error('[provision-address]', error)
      return NextResponse.json({ error: 'Could not create address' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Could not create address' }, { status: 500 })
}

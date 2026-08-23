import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditAgencyForm from './edit-agency-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Agency',
}

export default async function EditAgencyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single() as any

  if (!broker) redirect('/auth/login')

  // Get agency agreement
  const { data: agency } = await supabase
    .from('agency_agreements')
    .select(`
      *,
      agent:agents(id, first_name, last_name)
    `)
    .eq('id', id)
    .eq('broker_id', broker.id)
    .single() as any

  if (!agency) redirect('/dashboard/agencies')

  // Get listing if exists
  let listing = null
  if (agency.agreement_type === 'listing_agreement') {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('agency_agreement_id', id)
      .maybeSingle() as any
    listing = data
  }

  // Get all agents for dropdown
  const { data: agents } = await supabase
    .from('agents')
    .select('id, first_name, last_name')
    .eq('broker_id', broker.id)
    .order('last_name')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit {agency.agreement_type === 'listing_agreement' ? 'Listing' : 'Buyer Agreement'}</h1>
      <EditAgencyForm 
        agency={agency}
        listing={listing}
        agents={agents || []}
      />
    </div>
  )
}

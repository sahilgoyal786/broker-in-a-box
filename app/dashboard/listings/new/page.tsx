import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import NewListingForm from './new-listing-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Listing',
}

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ agency?: string }>
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')
  const role = userContext.role

  const params = await searchParams
  const agencyId = params.agency

  // If agency ID provided, fetch the agency agreement
  let agency = null
  if (agencyId) {
    const { data } = await supabase
      .from('agency_agreements')
      .select('*, agent:agents(id, first_name, last_name)')
      .eq('id', agencyId)
      .single() as any
    agency = data
  }

  // Get all agents for broker dropdown
  const { data: agents } = await supabase
    .from('agents')
    .select('id, first_name, last_name, email')
    .order('last_name')

  // Get current agent if agent role
  let currentAgent = null
  if (role === 'agent') {
    const { data } = await supabase
      .from('agents')
      .select('id')
      .eq('email', user.email)
      .single()
    currentAgent = data
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        {agency ? `Add Property Details: ${agency.client_first_name} ${agency.client_last_name}` : 'New Listing [UPDATED]'}
      </h1>
      <NewListingForm 
        role={role} 
        agents={agents || []} 
        currentAgentId={currentAgent?.id}
        agencyAgreement={agency}
      />
    </div>
  )
}

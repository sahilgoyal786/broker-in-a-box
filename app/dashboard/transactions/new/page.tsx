import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import NewTransactionForm from './new-transaction-form'

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ from_listing?: string; from_buyer?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')
  const role = userContext.role

  // Get broker ID
  let brokerId: string
  let agents: any[] = []
  let currentAgentId: string | null = null

  if (role === 'broker') {
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single() as any

    if (!broker) redirect('/auth/login')
    brokerId = broker.id

    const { data: agentsList } = await supabase
      .from('agents')
      .select('*')
      .eq('broker_id', broker.id)
      .order('last_name')
      .order('first_name') as any
    
    agents = agentsList || []
  } else {
    const { data: agent } = await supabase
      .from('agents')
      .select('id, broker_id, first_name, last_name')
      .eq('auth_user_id', user.id)
      .single() as any

    if (!agent) redirect('/auth/login')
    brokerId = agent.broker_id
    currentAgentId = agent.id
    agents = [agent]
  }

  // Check if creating from a listing or buyer agency
  let prefillData = null
  
  if (params.from_listing) {
    const { data: agency } = await supabase
      .from('agency_agreements')
      .select(`
        *,
        agent_id
      `)
      .eq('id', params.from_listing)
      .eq('broker_id', brokerId)
      .single() as any

    if (agency) {
      const { data: listing } = await supabase
        .from('listings')
        .select('*')
        .eq('agency_agreement_id', params.from_listing)
        .maybeSingle() as any

      prefillData = {
        agency_agreement_id: params.from_listing, // Link back to the listing
        agent_id: agency.agent_id,
        seller_first_name: agency.client_first_name,
        seller_last_name: agency.client_last_name,
        seller_email: agency.client_email,
        seller_phone: agency.client_phone,
        property_address: listing?.property_address || agency.property_address,
        property_city: listing?.property_city || agency.property_city,
        property_state: listing?.property_state || agency.property_state || 'UT',
        property_zip: listing?.property_zip || agency.property_zip,
        county: listing?.county || agency.county,
        property_type: listing?.property_type || agency.property_type,
        current_list_price: listing?.listing_price,
        transaction_type: 'listing', // They're the listing agent
      }
    }
  } else if (params.from_buyer) {
    const { data: agency } = await supabase
      .from('agency_agreements')
      .select(`
        *,
        agent_id
      `)
      .eq('id', params.from_buyer)
      .eq('broker_id', brokerId)
      .single() as any

    if (agency) {
      prefillData = {
        agency_agreement_id: params.from_buyer, // Link back to the buyer agency
        agent_id: agency.agent_id,
        buyer_first_name: agency.client_first_name,
        buyer_last_name: agency.client_last_name,
        buyer_email: agency.client_email,
        buyer_phone: agency.client_phone,
        transaction_type: 'buyer_agency', // They're the buyer's agent
      }
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        {params.from_listing && 'New Purchase Contract (from Listing)'}
        {params.from_buyer && 'New Purchase Contract (from Buyer Agency)'}
        {!params.from_listing && !params.from_buyer && 'New Purchase Contract'}
      </h1>
      {prefillData && params.from_listing && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          ✓ Pre-filled with seller information from listing agreement
        </div>
      )}
      {prefillData && params.from_buyer && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          ✓ Pre-filled with buyer information from buyer agency agreement
        </div>
      )}
      <NewTransactionForm 
        brokerId={brokerId} 
        agents={agents} 
        currentAgentId={currentAgentId}
        isAgent={role === 'agent'}
        prefillData={prefillData}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AgenciesTabs from './agencies-tabs'

export default async function AgenciesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')
  const role = userContext.role

  // Fetch all agency agreements
  let query = supabase
    .from('agency_agreements')
    .select(`
      id,
      file_id,
      agreement_type,
      agent_id,
      client_first_name,
      client_last_name,
      property_address,
      property_city,
      property_state,
      property_zip,
      county,
      mls_number,
      list_price,
      status,
      agreement_date,
      expiration_date,
      agent:agents(first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  // Agents only see their own
  if (role === 'agent') {
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (agent) {
      query = query.eq('agent_id', agent.id)
    }
  }

  const { data: allAgreements } = await query

  // Fetch pending transactions to determine U/C status
  const { data: pendingTransactions } = await supabase
    .from('transactions')
    .select('agency_agreement_id')
    .eq('status', 'pending')

  const underContractAgreementIds = new Set(
    pendingTransactions?.map(t => t.agency_agreement_id).filter(Boolean) || []
  )

  // Fetch listings from listings table (has county and mls_number)
  // Include transaction status to show U/C when under contract
  let listingsQuery = supabase
    .from('listings')
    .select(`
      id,
      agent_id,
      property_address,
      property_city,
      property_state,
      county,
      property_type,
      mls_number,
      listing_price,
      status,
      listing_start_date,
      listing_end_date,
      seller_name,
      agent:agents(first_name, last_name),
      agency_agreement:agency_agreements!inner(
        id,
        file_id,
        client_first_name,
        client_last_name
      )
    `)
    .order('created_at', { ascending: false })

  if (role === 'agent') {
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (agent) {
      listingsQuery = listingsQuery.eq('agent_id', agent.id)
    }
  }

  const { data: listingsData } = await listingsQuery

  // Map listings data to match Agreement type
  const listings = listingsData?.map(l => ({
    id: l.agency_agreement?.id || l.id,
    file_id: l.agency_agreement?.file_id,
    agreement_type: 'listing_agreement',
    agent_id: l.agent_id,
    client_first_name: l.agency_agreement?.client_first_name || '',
    client_last_name: l.agency_agreement?.client_last_name || '',
    property_address: l.property_address,
    property_city: l.property_city,
    property_state: l.property_state,
    county: l.county,
    property_type: l.property_type,
    mls_number: l.mls_number,
    list_price: l.listing_price,
    status: l.status,
    agreement_date: l.listing_start_date,
    expiration_date: l.listing_end_date,
    agent: l.agent,
    hasUnderContractTransaction: underContractAgreementIds.has(l.agency_agreement?.id || l.id)
  })) || []

  const buyerAgreements = allAgreements?.filter(a => a.agreement_type === 'buyer_agency_agreement').map(a => ({
    ...a,
    hasUnderContractTransaction: underContractAgreementIds.has(a.id)
  })) || []

  // Get list of agents for broker filter
  let agents: any[] = []
  if (role === 'broker') {
    const { data: agentsList } = await supabase
      .from('agents')
      .select('id, first_name, last_name')
      .eq('broker_id', userContext.brokerId)
      .eq('active', true)
      .order('last_name', { ascending: true })
    
    agents = agentsList ?? []
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agency Agreements</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/agencies/new?type=listing"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + New Listing
          </Link>
          <Link
            href="/dashboard/agencies/new?type=buyer"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Buyer Agreement
          </Link>
        </div>
      </div>

      <AgenciesTabs 
        listings={listings} 
        buyerAgreements={buyerAgreements}
        role={role}
        agents={agents}
      />
    </div>
  )
}

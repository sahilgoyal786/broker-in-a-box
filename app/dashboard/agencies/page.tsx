import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AgenciesTabs from './agencies-tabs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agencies',
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

type AgentRelation = {
  first_name: string | null
  last_name: string | null
}

type AgreementRow = {
  id: string
  file_id: string | null
  agreement_type: string | null
  agent_id: string | null
  client_first_name: string | null
  client_last_name: string | null
  property_address: string | null
  property_city: string | null
  property_state: string | null
  property_zip: string | null
  county: string | null
  property_type: string | null
  mls_number: string | null
  list_price: number | null
  status: string | null
  agreement_date: string | null
  expiration_date: string | null
  agent: AgentRelation | AgentRelation[] | null
}

type ListingRow = {
  agency_agreement_id: string | null
  property_address: string | null
  property_city: string | null
  property_state: string | null
  county: string | null
  property_type: string | null
  mls_number: string | null
  listing_price: number | null
  current_list_price: number | null
  listing_start_date: string | null
  listing_end_date: string | null
  created_at: string | null
}

type TransactionRow = {
  agency_agreement_id: string | null
}

type AgentOption = {
  id: string
  first_name: string | null
  last_name: string | null
}

export default async function AgenciesPage() {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) redirect('/auth/login')

  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')
  const role = userContext.role

  // Agents only see their own records — look up their agent id once up front
  let agentId: string | null = null
  if (role === 'agent') {
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('email', user.email)
      .single()
    agentId = (agent as { id?: string } | null)?.id ?? null
  }

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
      property_type,
      mls_number,
      list_price,
      status,
      agreement_date,
      expiration_date,
      agent:agents!agency_agreements_agent_id_fkey(first_name, last_name)
    `)
    .eq('broker_id', userContext.brokerId)
    .order('created_at', { ascending: false })

  if (agentId) {
    query = query.eq('agent_id', agentId)
  }

  let pendingTransactionsQuery = supabase
    .from('transactions')
    .select('agency_agreement_id')
    .eq('broker_id', userContext.brokerId)
    .in('status', ['pending', 'under_contract', 'pending_closure', 'pending_cancellation'])

  if (agentId) {
    pendingTransactionsQuery = pendingTransactionsQuery.eq('agent_id', agentId)
  }

  // These queries are independent — run them in parallel
  const [
    { data: allAgreements },
    { data: pendingTransactions },
    { data: agentsList },
  ] = await Promise.all([
    query,
    pendingTransactionsQuery,
    role === 'broker'
      ? supabase.from('agents')
          .select('id, first_name, last_name')
          .eq('broker_id', userContext.brokerId)
          .eq('active', true)
          .order('last_name', { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  const agreements = (allAgreements ?? []) as unknown as AgreementRow[]
  const transactions = (pendingTransactions ?? []) as unknown as TransactionRow[]

  const underContractAgreementIds = new Set(
    transactions.map(t => t.agency_agreement_id).filter(Boolean)
  )

  const listingAgreements = agreements.filter(a => a.agreement_type === 'listing_agreement')
  const listingAgreementIds = listingAgreements.map(a => a.id)
  const { data: listingsData } = listingAgreementIds.length
    ? await supabase
      .from('listings')
      .select(`
        agency_agreement_id,
        property_address,
        property_city,
        property_state,
        county,
        property_type,
        mls_number,
        listing_price,
        current_list_price,
        listing_start_date,
        listing_end_date,
        created_at
      `)
      .eq('broker_id', userContext.brokerId)
      .in('agency_agreement_id', listingAgreementIds)
      .order('created_at', { ascending: false })
    : { data: [] }

  const listingRows = ((listingsData ?? []) as unknown as ListingRow[]).filter(l => l.agency_agreement_id)
  const listingsByAgreementId = new Map<string, ListingRow>()
  for (const listing of listingRows) {
    if (!listingsByAgreementId.has(listing.agency_agreement_id)) {
      listingsByAgreementId.set(listing.agency_agreement_id, listing)
    }
  }

  const listings = listingAgreements.map(agreement => {
    const listing = listingsByAgreementId.get(agreement.id)
    const agent = firstRelation(agreement.agent) ?? { first_name: '', last_name: '' }

    return {
      id: agreement.id,
      file_id: agreement.file_id,
      agreement_type: 'listing_agreement',
      agent_id: agreement.agent_id,
      client_first_name: agreement.client_first_name,
      client_last_name: agreement.client_last_name,
      property_address: listing?.property_address ?? agreement.property_address,
      property_city: listing?.property_city ?? agreement.property_city,
      property_state: listing?.property_state ?? agreement.property_state,
      property_zip: agreement.property_zip,
      county: listing?.county ?? agreement.county,
      property_type: listing?.property_type ?? agreement.property_type,
      mls_number: listing?.mls_number ?? agreement.mls_number,
      list_price: listing?.current_list_price ?? listing?.listing_price ?? agreement.list_price,
      status: agreement.status,
      agreement_date: agreement.agreement_date,
      expiration_date: agreement.expiration_date,
      agent,
      hasUnderContractTransaction: underContractAgreementIds.has(agreement.id)
    }
  })

  const buyerAgreements = agreements.filter(a => a.agreement_type === 'buyer_agency_agreement').map(a => ({
    ...a,
    agent: firstRelation(a.agent) ?? { first_name: '', last_name: '' },
    hasUnderContractTransaction: underContractAgreementIds.has(a.id)
  }))

  const agents = (agentsList ?? []) as unknown as AgentOption[]

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

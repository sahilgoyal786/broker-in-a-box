import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AgenciesTabs from './agencies-tabs'

export default async function AgenciesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  const role = await getUserRole()
  if (!role) redirect('/auth/login')

  // Fetch all agency agreements
  let query = supabase
    .from('agency_agreements')
    .select(`
      *,
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

  // Split into listings and buyer agreements
  const listings = allAgreements?.filter(a => a.agreement_type === 'listing_agreement') || []
  const buyerAgreements = allAgreements?.filter(a => a.agreement_type === 'buyer_agency_agreement') || []

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
      />
    </div>
  )
}

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/supabase/get-user-role'

export default async function AgenciesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')

  // Build query based on role
  let query = supabase
    .from('agency_agreements')
    .select(`
      *,
      agent:agents(first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  if (userContext.role === 'broker') {
    // Brokers see all agreements for their brokerage
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single() as any
    
    if (!broker) redirect('/auth/login')
    query = query.eq('broker_id', broker.id)
  } else {
    // Agents see only their own agreements
    query = query.eq('agent_id', userContext.agentId!)
  }

  const { data: agencies } = await query as any

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agency Agreements</h1>
        {userContext.role === 'broker' && (
          <Link
            href="/dashboard/agencies/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Agency Agreement
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agencies?.map((agency: any) => (
              <tr key={agency.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/dashboard/agencies/${agency.id}`} className="text-blue-600 hover:underline">
                    {agency.agreement_type === 'listing_agreement' ? 'Listing' : 'Buyer Agency'}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {agency.client_first_name} {agency.client_last_name}
                </td>
                <td className="px-6 py-4">
                  {agency.property_address || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {agency.agent?.first_name} {agency.agent?.last_name}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    agency.status === 'active' ? 'bg-green-100 text-green-800' :
                    agency.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {agency.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(agency.agreement_date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!agencies || agencies.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No agency agreements yet. Create your first one to get started.
          </div>
        ) : null}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Agency Agreements</h1>
          <p className="text-slate-400 mt-1">{agencies?.length ?? 0} total</p>
        </div>
        <Link
          href="/dashboard/agencies/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Agency Agreement
        </Link>
      </div>

      {!agencies || agencies.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-16 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No agency agreements yet</h3>
          <p className="text-slate-400 mb-6">Create your first agency agreement to get started.</p>
          <Link
            href="/dashboard/agencies/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Agency Agreement
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {agencies.map((agency: any) => (
                <tr key={agency.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/agencies/${agency.id}`} className="text-blue-400 hover:text-blue-300 font-medium">
                      {agency.agreement_type === 'listing_agreement' ? 'Listing' : 'Buyer Agency'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {agency.client_first_name} {agency.client_last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {agency.property_address || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {agency.agent?.first_name} {agency.agent?.last_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-lg border ${
                      agency.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      agency.status === 'expired' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {agency.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(agency.agreement_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

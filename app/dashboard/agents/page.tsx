import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, Upload, AlertTriangle } from 'lucide-react'
import { getUserContext } from '@/lib/supabase/get-user-role'

export default async function AgentsPage() {
  const userContext = await getUserContext()
  const supabase = await createClient()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', userContext!.userId)
    .single() as any

  const { data: agents } = await supabase
    .from('agents')
    .select('id, first_name, last_name, email, license_number, license_expiration, active, ce_hours_core, ce_hours_other, mandatory_course_completed')
    .eq('broker_id', broker?.id ?? '')
    .eq('active', true)  // Only show active agents
    .order('last_name', { ascending: true }) as any

  // Get production stats for each agent
  const agentsWithStats = await Promise.all((agents ?? []).map(async (agent: any) => {
    // Active listings (agency agreements with no active transaction)
    const { data: allListings } = await supabase
      .from('agency_agreements')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('agreement_type', 'listing_agreement')
      .eq('status', 'active') as any

    const { data: listingsWithDeals } = await supabase
      .from('transactions')
      .select('agency_agreement_id')
      .eq('agent_id', agent.id)
      .eq('agency_role', 'listing_agent')
      .in('status', ['pending', 'under_contract', 'pending_closure', 'pending_cancellation'])
      .not('agency_agreement_id', 'is', null) as any

    const listingsWithDealsSet = new Set(listingsWithDeals?.map((t: any) => t.agency_agreement_id) ?? [])
    const activeListings = allListings?.filter((a: any) => !listingsWithDealsSet.has(a.id)).length ?? 0

    // Pending sales (both buyer and seller side combined)
    const { count: pendingSales } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .in('status', ['pending', 'under_contract', 'pending_closure', 'pending_cancellation']) as any

    // Closed transactions (both buyer and seller side combined)
    const { count: closedDeals } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .eq('status', 'closed') as any

    // Calculate days until license expiration
    let daysUntilExpiration = null
    if (agent.license_expiration) {
      const expDate = new Date(agent.license_expiration)
      const today = new Date()
      const diffTime = expDate.getTime() - today.getTime()
      daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    return {
      ...agent,
      activeListings,
      pendingSales: pendingSales ?? 0,
      closedDeals: closedDeals ?? 0,
      daysUntilExpiration
    }
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-slate-400 mt-1">{agents?.length ?? 0} agent{(agents?.length ?? 0) !== 1 ? 's' : ''} on your roster</p>
        </div>
        {userContext?.role === 'broker' && (
          <div className="flex gap-3">
            <Link
              href="/dashboard/agents/upload"
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </Link>
            <Link
              href="/dashboard/agents/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Agent
            </Link>
          </div>
        )}
      </div>

      {!agents || agents.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-16 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No agents yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Add your agents to assign them to transactions.
          </p>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Agent
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Email</th>
                <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Core</th>
                <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Elective</th>
                <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Mandatory</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Expires</th>
                <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Listings</th>
                <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Sales</th>
                <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {agentsWithStats.map((agent: any) => {
                const isExpiring = agent.daysUntilExpiration !== null && agent.daysUntilExpiration <= 45 && agent.daysUntilExpiration >= 0
                const isExpired = agent.daysUntilExpiration !== null && agent.daysUntilExpiration < 0
                
                return (
                  <tr key={agent.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-6 py-4">
                      <Link 
                        href={`/dashboard/agents/${agent.id}`}
                        className="text-white font-medium text-sm hover:text-blue-400 transition-colors"
                      >
                        {agent.last_name}, {agent.first_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-300 text-sm">{agent.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-slate-300 text-sm font-medium">{agent.ce_hours_core ?? 0}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-slate-300 text-sm font-medium">{agent.ce_hours_other ?? 0}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {agent.mandatory_course_completed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">YES</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">NO</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {agent.license_expiration ? (
                        <div className="flex items-center gap-2">
                          {(isExpiring || isExpired) && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                          <div>
                            <p className={`text-sm font-medium ${
                              isExpired ? 'text-red-400' :
                              isExpiring ? 'text-orange-400' :
                              'text-slate-300'
                            }`}>
                              {new Date(agent.license_expiration).toLocaleDateString()}
                            </p>
                            {isExpiring && agent.daysUntilExpiration > 0 && (
                              <p className="text-xs text-orange-300">{agent.daysUntilExpiration} days</p>
                            )}
                            {isExpired && (
                              <p className="text-xs text-red-300">EXPIRED</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic text-sm">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-blue-400 font-semibold text-lg">{agent.activeListings}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-yellow-400 font-semibold text-lg">{agent.pendingSales}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-400 font-semibold text-lg">{agent.closedDeals}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

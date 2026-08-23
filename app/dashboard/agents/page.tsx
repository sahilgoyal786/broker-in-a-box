import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, Upload } from 'lucide-react'
import { getUserContext } from '@/lib/supabase/get-user-role'
import AgentsTable from './agents-table'
import { daysUntilDateOnly } from '@/lib/date-only'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agents',
}

export default async function AgentsPage() {
  const userContext = await getUserContext()
  const supabase = await createClient()
  const brokerId = userContext!.brokerId

  // Fetch agents and broker-wide stats in parallel instead of waterfalling —
  // none of these queries depend on each other, they're all scoped by brokerId.
  const [
    { data: agents },
    { data: allListingAgreements },
    { data: listingTransactions },
    { data: allTransactions },
  ] = await Promise.all([
    supabase.from('agents')
      .select('id, first_name, last_name, email, license_number, license_expiration, ce_due_date, ce_completed_hours, ce_required_hours, ce_core_hours, ce_elective_hours, mandatory_course_completed, invite_status, nar_member, nar_code_of_ethics_date, nar_code_of_ethics_completed, nar_code_of_ethics_cert_url, nar_fair_housing_date, nar_fair_housing_completed, nar_fair_housing_cert_url')
      .eq('broker_id', brokerId)
      .eq('is_active', true)
      .order('last_name', { ascending: true }),
    supabase.from('agency_agreements')
      .select('id, agent_id')
      .eq('broker_id', brokerId)
      .eq('agreement_type', 'listing_agreement')
      .eq('status', 'active'),
    supabase.from('transactions')
      .select('agency_agreement_id, agent_id')
      .eq('broker_id', brokerId)
      .eq('transaction_type', 'listing')
      .in('status', ['pending', 'under_contract', 'pending_closure', 'pending_cancellation'])
      .not('agency_agreement_id', 'is', null),
    supabase.from('transactions')
      .select('agent_id, status')
      .eq('broker_id', brokerId),
  ]) as any

  const listingsWithDealsSet = new Set(listingTransactions?.map((t: any) => t.agency_agreement_id) ?? [])
  const pendingStatuses = new Set(['pending', 'under_contract', 'pending_closure', 'pending_cancellation'])

  // Get production stats for each agent from the bulk data
  const agentsWithStats = (agents ?? []).map((agent: any) => {
    const activeListings = allListingAgreements
      ?.filter((a: any) => a.agent_id === agent.id && !listingsWithDealsSet.has(a.id)).length ?? 0

    const agentTransactions = allTransactions?.filter((t: any) => t.agent_id === agent.id) ?? []
    const pendingSales = agentTransactions.filter((t: any) => pendingStatuses.has(t.status)).length
    const closedDeals = agentTransactions.filter((t: any) => t.status === 'closed').length

    // Calculate days until license expiration
    const daysUntilExpiration = daysUntilDateOnly(agent.license_expiration)

    return {
      ...agent,
      ce_hours_core: agent.ce_core_hours ?? 0,
      ce_hours_other: agent.ce_elective_hours ?? 0,
      nar_cycle_end: null,
      activeListings,
      pendingSales,
      closedDeals,
      daysUntilExpiration
    }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600 mt-1">{agents?.length ?? 0} agent{(agents?.length ?? 0) !== 1 ? 's' : ''} on your roster</p>
        </div>
        {userContext?.role === 'broker' && (
          <div className="flex gap-3">
            <Link
              href="/dashboard/agents/upload"
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </Link>
            <Link
              href="/dashboard/agents/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
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
        <AgentsTable agents={agentsWithStats} />
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, CheckCircle, Clock, Users, GraduationCap } from 'lucide-react'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const userContext = await getUserContext()
  
  if (!userContext) redirect('/auth/login')

  const { data: broker } = await supabase
    .from('brokers')
    .select('id, name')
    .eq('id', userContext.brokerId)
    .single() as any

  // Stats
  const [
    { count: listingsUnderContract },
    { count: buyersUnderContract },
    { count: listingsClosed },
    { count: buyersClosed }
  ] = await Promise.all([
    // Listings pending (includes CTP review and cancellation review - still pending until approved)
    supabase.from('transactions').select('*', { count: 'exact', head: true })
      .eq('broker_id', userContext.brokerId)
      .eq('transaction_type', 'listing')
      .in('status', ['pending', 'under_contract', 'pending_closure', 'pending_cancellation']),
    // Buyers pending (includes CTP review and cancellation review - still pending until approved)
    supabase.from('transactions').select('*', { count: 'exact', head: true })
      .eq('broker_id', userContext.brokerId)
      .in('transaction_type', ['buyer_agency', 'limited_agency'])
      .in('status', ['pending', 'under_contract', 'pending_closure', 'pending_cancellation']),
    // Listings closed (only when office marks it closed)
    supabase.from('transactions').select('*', { count: 'exact', head: true })
      .eq('broker_id', userContext.brokerId)
      .eq('transaction_type', 'listing')
      .eq('status', 'closed'),
    // Buyers closed (only when office marks it closed)
    supabase.from('transactions').select('*', { count: 'exact', head: true })
      .eq('broker_id', userContext.brokerId)
      .in('transaction_type', ['buyer_agency', 'limited_agency'])
      .eq('status', 'closed'),
  ])

  // Active listings = listing agreements without CLOSED transactions
  const { data: allListingAgreements } = await supabase
    .from('agency_agreements')
    .select('id')
    .eq('broker_id', userContext.brokerId)
    .eq('agreement_type', 'listing_agreement')
    .eq('status', 'active') as any

  const { data: closedListings } = await supabase
    .from('transactions')
    .select('agency_agreement_id')
    .eq('broker_id', userContext.brokerId)
    .eq('transaction_type', 'listing')
    .eq('status', 'closed')
    .not('agency_agreement_id', 'is', null) as any

  const closedListingsSet = new Set(closedListings?.map((t: any) => t.agency_agreement_id) ?? [])
  const activeListings = allListingAgreements?.filter((a: any) => !closedListingsSet.has(a.id)).length ?? 0

  // Active buyer brokers = buyer agency agreements without CLOSED transactions
  const { data: allBuyerAgreements } = await supabase
    .from('agency_agreements')
    .select('id')
    .eq('broker_id', userContext.brokerId)
    .eq('agreement_type', 'buyer_agency_agreement')
    .eq('status', 'active') as any

  const { data: closedBuyers } = await supabase
    .from('transactions')
    .select('agency_agreement_id')
    .eq('broker_id', userContext.brokerId)
    .in('transaction_type', ['buyer_agency', 'limited_agency'])
    .eq('status', 'closed')
    .not('agency_agreement_id', 'is', null) as any

  const closedBuyersSet = new Set(closedBuyers?.map((t: any) => t.agency_agreement_id) ?? [])
  const activeBuyerBrokers = allBuyerAgreements?.filter((a: any) => !closedBuyersSet.has(a.id)).length ?? 0

  // Agents KPIs
  const { data: allAgents } = await supabase
    .from('agents')
    .select('id, first_name, last_name, license_expiration, mandatory_course_completed')
    .eq('broker_id', userContext.brokerId)
    .eq('active', true) as any

  const totalAgents = allAgents?.length ?? 0

  const ceNeedsAttention = allAgents?.filter((agent: any) => {
    if (!agent.mandatory_course_completed) return true
    if (agent.license_expiration) {
      const daysUntil = Math.ceil((new Date(agent.license_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntil < 60) return true
    }
    return false
  }).length ?? 0

  // Get transaction counts per agent
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('agent_id, status')
    .eq('broker_id', userContext.brokerId) as any

  // Count agents with any transactions
  const agentsWithTransactionsSet = new Set(allTransactions?.map((t: any) => t.agent_id) ?? [])
  const agentsWithTransactions = agentsWithTransactionsSet.size

  // Count agents with pending sales
  const agentsWithPendingSet = new Set(
    allTransactions?.filter((t: any) => 
      ['pending', 'under_contract'].includes(t.status)
    ).map((t: any) => t.agent_id) ?? []
  )
  const agentsWithPending = agentsWithPendingSet.size

  // Calculate top agents by pending sales count
  const agentPendingCounts = allTransactions
    ?.filter((t: any) => ['pending', 'under_contract'].includes(t.status))
    .reduce((acc: any, t: any) => {
      acc[t.agent_id] = (acc[t.agent_id] || 0) + 1
      return acc
    }, {}) ?? {}

  const topAgents = Object.entries(agentPendingCounts)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)
    .map(([agentId, count]) => {
      const agent = allAgents?.find((a: any) => a.id === agentId)
      return {
        id: agentId,
        name: agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown',
        pendingCount: count
      }
    })

  // Calculate totals
  // Totals Pending = only transactions under contract (not active listings)
  const totalsPending = (listingsUnderContract ?? 0) + (buyersUnderContract ?? 0)
  const totalsClosed = (listingsClosed ?? 0) + (buyersClosed ?? 0)

  const stats = [
    // Row 1: Active pipeline
    { 
      label: 'Active Agreements', 
      icon: FileText, 
      color: 'text-blue-400', 
      href: '/dashboard/agencies',
      split: true,
      rows: [
        { label: 'Listings', value: activeListings ?? 0 },
        { label: 'Buyer Brokers', value: activeBuyerBrokers ?? 0 }
      ]
    },
    { label: 'Listings Pending', value: listingsUnderContract ?? 0, icon: Clock, color: 'text-yellow-400', href: '/dashboard/transactions' },
    { label: 'Buyers Pending', value: buyersUnderContract ?? 0, icon: Clock, color: 'text-purple-400', href: '/dashboard/transactions' },
    { label: 'Totals Pending', value: totalsPending, icon: FileText, color: 'text-orange-400', href: '/dashboard/transactions', highlighted: true },
    
    // Row 2: Performance + closed
    { label: 'CE Alerts', value: ceNeedsAttention, icon: GraduationCap, color: ceNeedsAttention > 0 ? 'text-red-400' : 'text-green-400', href: '/dashboard/agents' },
    { label: 'Listings Closed', value: listingsClosed ?? 0, icon: CheckCircle, color: 'text-green-400', href: '/dashboard/transactions' },
    { label: 'Buyers Closed', value: buyersClosed ?? 0, icon: CheckCircle, color: 'text-green-400', href: '/dashboard/transactions' },
    { label: 'Totals Closed', value: totalsClosed, icon: CheckCircle, color: 'text-emerald-400', href: '/dashboard/transactions', highlighted: true },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {broker?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat: any) => {
          const { label, value, icon: Icon, color, href, highlighted, split, rows } = stat
          
          return (
            <Link 
              key={label} 
              href={href} 
              className={`rounded-lg p-6 border transition-colors shadow ${
                highlighted 
                  ? 'bg-blue-50 border-blue-200 hover:border-blue-300' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-medium ${highlighted ? 'text-gray-700' : 'text-gray-600'}`}>{label}</p>
                <Icon className={`w-5 h-5 ${color.replace('text-', 'text-')}`} />
              </div>
              
              {split && rows ? (
                // Split card with two rows
                <div className="space-y-2">
                  {rows.map((row: any, idx: number) => (
                    <div key={idx} className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-600">{row.label}</span>
                      <span className="text-2xl font-bold text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                // Regular single value card
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              )}
            </Link>
          )
        })}
      </div>

      {/* Agent Performance KPIs - Broker Only */}
      {userContext.role === 'broker' && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Agent Performance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Agents */}
          <Link href="/dashboard/agents" className="bg-white rounded-lg border border-gray-200 shadow p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalAgents}</p>
          </Link>

          {/* Agents with Transactions */}
          <Link href="/dashboard/agents" className="bg-white rounded-lg border border-gray-200 shadow p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Agents with Transactions</p>
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{agentsWithTransactions}</p>
            <p className="text-xs text-gray-500 mt-1">
              {totalAgents > 0 ? Math.round((agentsWithTransactions / totalAgents) * 100) : 0}% active
            </p>
          </Link>

          {/* Agents with U/C Sales */}
          <Link href="/dashboard/agents" className="bg-white rounded-lg border border-gray-200 shadow p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Agents with U/C Sales</p>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{agentsWithPending}</p>
            <p className="text-xs text-gray-500 mt-1">Currently under contract</p>
          </Link>

          {/* Top 3 Agents */}
          <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600">Top Agents (U/C)</p>
              <CheckCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="space-y-2">
              {topAgents.length > 0 ? (
                topAgents.map((agent: any, idx: number) => (
                  <div key={agent.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">
                      {idx + 1}. {agent.name}
                    </span>
                    <span className="font-semibold text-gray-700">{agent.pendingCount}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No deals under contract yet</p>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}

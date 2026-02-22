import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, CheckCircle, Clock, AlertCircle, Users, GraduationCap } from 'lucide-react'
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

  // CE Compliance - count agents needing attention
  const { data: allAgents } = await supabase
    .from('agents')
    .select('id, license_expiration, mandatory_course_completed')
    .eq('broker_id', userContext.brokerId)
    .eq('status', 'active') as any

  const ceNeedsAttention = allAgents?.filter((agent: any) => {
    if (!agent.mandatory_course_completed) return true
    if (agent.license_expiration) {
      const daysUntil = Math.ceil((new Date(agent.license_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntil < 60) return true
    }
    return false
  }).length ?? 0

  // Recent transactions (exclude cancelled and closed)
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('id, buyer_first_name, buyer_last_name, seller_first_name, seller_last_name, property_address, property_city, property_type, transaction_type, status, created_at')
    .eq('broker_id', userContext.brokerId)
    .in('status', ['pending', 'under_contract', 'pending_closure', 'pending_cancellation'])
    .order('created_at', { ascending: false })
    .limit(5) as any

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

  const statusColors: Record<string, string> = {
    active: 'bg-yellow-500/20 text-yellow-400',
    under_contract: 'bg-yellow-500/20 text-yellow-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    pending_closure: 'bg-blue-500/20 text-blue-400',
    pending_cancellation: 'bg-orange-500/20 text-orange-400',
    closed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    expired: 'bg-slate-500/20 text-slate-400',
  }

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

      {/* Active Deals */}
      <div className="bg-white rounded-lg border border-gray-200 shadow">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-gray-900 font-semibold">Active Deals</h2>
            <p className="text-gray-600 text-sm mt-0.5">Under contract or in review</p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
          >
            View all →
          </Link>
        </div>

        {!recentTransactions || recentTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No active deals</p>
            <p className="text-gray-500 text-sm mt-2">Transactions under contract or in review will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentTransactions.map((tx: any) => {
              // Client = whoever we represent
              const clientFirstName = tx.transaction_type === 'listing' ? tx.seller_first_name : tx.buyer_first_name
              const clientLastName = tx.transaction_type === 'listing' ? tx.seller_last_name : tx.buyer_last_name
              const roleLabel = tx.transaction_type === 'listing' ? 'Listing' : tx.transaction_type === 'buyer_agency' ? 'Buyer' : 'Limited Agency'
              
              return (
                <Link
                  key={tx.id}
                  href={`/dashboard/transactions/${tx.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-gray-900 font-medium text-sm">
                      {clientLastName}, {clientFirstName}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {tx.property_address ?? 'No address'} {tx.property_city && `· ${tx.property_city}`} · {roleLabel} Side
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[tx.status]}`}>
                    {tx.status === 'pending_closure' ? 'CTP Review' :
                     tx.status === 'pending_cancellation' ? 'Cancel Review' :
                     tx.status?.replace(/_/g, ' ')}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Calendar, User, Shield, TrendingUp } from 'lucide-react'
import DeactivateButton from './deactivate-button'

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userContext = await getUserContext()
  const supabase = await createClient()

  // Only broker can view agent details
  if (!userContext || userContext.role !== 'broker') {
    redirect('/dashboard')
  }

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', userContext.userId)
    .single() as any

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .eq('broker_id', broker?.id)
    .single() as any

  if (!agent) notFound()

  // Get production stats
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

  const { count: pendingSales } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agent.id)
    .in('status', ['pending', 'under_contract', 'pending_closure', 'pending_cancellation']) as any

  const { count: closedDeals } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agent.id)
    .eq('status', 'closed') as any

  // Recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('id, property_address, agency_role, status, created_at')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .limit(5) as any

  // License expiration
  let daysUntilExpiration = null
  if (agent.license_expiration) {
    const expDate = new Date(agent.license_expiration)
    const today = new Date()
    const diffTime = expDate.getTime() - today.getTime()
    daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  const isExpiring = daysUntilExpiration !== null && daysUntilExpiration <= 45 && daysUntilExpiration >= 0
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0

  return (
    <div className="p-8 max-w-6xl">
      <Link
        href="/dashboard/agents"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {agent.first_name} {agent.last_name}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-slate-400">Agent Profile</p>
            {!agent.active && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                INACTIVE
              </span>
            )}
          </div>
        </div>
        <DeactivateButton 
          agentId={agent.id} 
          agentName={`${agent.first_name} ${agent.last_name}`}
          isActive={agent.active ?? true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Contact & License */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <a href={`mailto:${agent.email}`} className="text-sm text-blue-400 hover:underline">
                    {agent.email}
                  </a>
                </div>
              </div>
              {agent.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <a href={`tel:${agent.phone}`} className="text-sm text-slate-300">
                      {agent.phone}
                    </a>
                  </div>
                </div>
              )}
              {agent.address && (
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Mailing Address</p>
                  <p className="text-sm text-slate-300">{agent.address}</p>
                  <p className="text-sm text-slate-300">
                    {agent.city}, {agent.state} {agent.zip}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* License Info */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">License</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">License Number</p>
                  <p className="text-sm text-slate-300">
                    {agent.license_number || <span className="italic">Not set</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Expiration</p>
                  {agent.license_expiration ? (
                    <div>
                      <p className={`text-sm font-medium ${
                        isExpired ? 'text-red-400' :
                        isExpiring ? 'text-orange-400' :
                        'text-slate-300'
                      }`}>
                        {new Date(agent.license_expiration).toLocaleDateString()}
                      </p>
                      {isExpiring && daysUntilExpiration > 0 && (
                        <p className="text-xs text-orange-300">{daysUntilExpiration} days remaining</p>
                      )}
                      {isExpired && (
                        <p className="text-xs text-red-300">EXPIRED</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 italic">Not set</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CE Compliance */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">CE Compliance</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Core Hours</p>
                  <p className="text-2xl font-bold text-white">{agent.ce_hours_core ?? 0}</p>
                  <p className="text-xs text-slate-400">of 12 required</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Elective Hours</p>
                  <p className="text-2xl font-bold text-white">{agent.ce_hours_other ?? 0}</p>
                  <p className="text-xs text-slate-400">of 6 required</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-500 mb-2">Mandatory 3-Hour Course</p>
                {agent.mandatory_course_completed ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    ✓ Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                    ✗ Not Completed
                  </span>
                )}
              </div>
              {agent.ce_last_updated && (
                <div className="pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400">
                    Last updated: {new Date(agent.ce_last_updated).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Info */}
          {(agent.date_of_birth || agent.gender) && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
              <div className="space-y-3">
                {agent.date_of_birth && (
                  <div>
                    <p className="text-xs text-slate-500">Date of Birth</p>
                    <p className="text-sm text-slate-300">
                      {new Date(agent.date_of_birth).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Age: {Math.floor((new Date().getTime() - new Date(agent.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
                    </p>
                  </div>
                )}
                {agent.gender && (
                  <div>
                    <p className="text-xs text-slate-500">Gender</p>
                    <p className="text-sm text-slate-300">{agent.gender}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Info */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Professional</h2>
            <div className="space-y-3">
              {agent.primary_board && (
                <div>
                  <p className="text-xs text-slate-500">Primary Board/MLS</p>
                  <p className="text-sm text-slate-300">{agent.primary_board}</p>
                </div>
              )}
              {agent.original_license_date && (
                <div>
                  <p className="text-xs text-slate-500">Original License Date</p>
                  <p className="text-sm text-slate-300">
                    {new Date(agent.original_license_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {Math.floor((new Date().getTime() - new Date(agent.original_license_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years licensed
                  </p>
                </div>
              )}
              {agent.current_company && (
                <div>
                  <p className="text-xs text-slate-500">Previous Company</p>
                  <p className="text-sm text-slate-300">{agent.current_company}</p>
                </div>
              )}
              {agent.hire_date && (
                <div>
                  <p className="text-xs text-slate-500">Hire Date</p>
                  <p className="text-sm text-slate-300">
                    {new Date(agent.hire_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {agent.listings_at_hire !== null && agent.listings_at_hire !== undefined && (
                <div>
                  <p className="text-xs text-slate-500">Listings at Hire</p>
                  <p className="text-sm text-slate-300">{agent.listings_at_hire}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tax/Payment Info */}
          {(agent.payment_method || agent.entity_name || agent.ssn_last_4 || agent.ein) && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Tax & Payment</h2>
              <div className="space-y-3">
                {agent.payment_method && (
                  <div>
                    <p className="text-xs text-slate-500">Payment Method</p>
                    <p className="text-sm text-slate-300 capitalize">{agent.payment_method}</p>
                  </div>
                )}
                {agent.entity_name && (
                  <div>
                    <p className="text-xs text-slate-500">Entity Name</p>
                    <p className="text-sm text-slate-300">{agent.entity_name}</p>
                  </div>
                )}
                {agent.ssn_last_4 && (
                  <div>
                    <p className="text-xs text-slate-500">SSN</p>
                    <p className="text-sm text-slate-300">***-**-{agent.ssn_last_4}</p>
                  </div>
                )}
                {agent.ein && (
                  <div>
                    <p className="text-xs text-slate-500">EIN</p>
                    <p className="text-sm text-slate-300">{agent.ein}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Production */}
        <div className="lg:col-span-2 space-y-6">
          {/* Production Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Active Listings</p>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-blue-400">{activeListings}</p>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Pending Sales</p>
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-yellow-400">{pendingSales ?? 0}</p>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Closed Deals</p>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400">{closedDeals ?? 0}</p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
            {!recentTransactions || recentTransactions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((txn: any) => (
                  <Link
                    key={txn.id}
                    href={`/dashboard/transactions/${txn.id}`}
                    className="block p-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <p className="text-white font-medium text-sm">{txn.property_address}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {txn.agency_role?.replace(/_/g, ' ')} · {txn.status?.replace(/_/g, ' ')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

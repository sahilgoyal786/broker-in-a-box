import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Calendar, User, Shield, TrendingUp } from 'lucide-react'
import DeactivateButton from './deactivate-button'
import { daysUntilDateOnly, formatDateOnly, parseDateOnly } from '@/lib/date-only'
import { formatPhoneNumber, phoneTelHref } from '@/lib/phone'

function formatPortalStatus(status: string | null) {
  switch (status) {
    case 'active':
      return 'Active'
    case 'invited':
      return 'Invited'
    case 'expired':
      return 'Expired'
    case 'not_invited':
    default:
      return 'Not Invited'
  }
}

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
  const daysUntilExpiration = daysUntilDateOnly(agent.license_expiration)
  const isExpiring = daysUntilExpiration !== null && daysUntilExpiration <= 45 && daysUntilExpiration >= 0
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0

  return (
    <div className="p-8 max-w-6xl">
      <Link
        href="/dashboard/agents"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {agent.first_name} {agent.last_name}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-600">Agent Profile</p>
            {!agent.is_active && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full border border-red-200">
                INACTIVE
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/agents/${agent.id}/edit`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Edit
          </Link>
          <DeactivateButton 
            agentId={agent.id} 
            agentName={`${agent.first_name} ${agent.last_name}`}
            isActive={agent.is_active ?? true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Contact & License */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <a href={`mailto:${agent.email}`} className="text-sm text-blue-600 hover:underline">
                    {agent.email}
                  </a>
                </div>
              </div>
              {agent.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-600">Phone</p>
                    <a href={phoneTelHref(agent.phone)} className="text-sm text-gray-900">
                      {formatPhoneNumber(agent.phone)}
                    </a>
                  </div>
                </div>
              )}
              {agent.address && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Mailing Address</p>
                  <p className="text-sm text-gray-900">{agent.address}</p>
                  <p className="text-sm text-gray-900">
                    {agent.city}, {agent.state} {agent.zip}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* License Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">License</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">License Number</p>
                  <p className="text-sm text-gray-900">
                    {agent.license_number || <span className="italic text-gray-500">Not set</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">License Expiration</p>
                  {agent.license_expiration ? (
                    <div>
                      <p className={`text-sm font-medium ${
                        isExpired ? 'text-red-600' :
                        isExpiring ? 'text-orange-600' :
                        'text-gray-900'
                      }`}>
                        {formatDateOnly(agent.license_expiration)}
                      </p>
                      {isExpiring && daysUntilExpiration > 0 && (
                        <p className="text-xs text-orange-600">{daysUntilExpiration} days remaining</p>
                      )}
                      {isExpired && (
                        <p className="text-xs text-red-600">EXPIRED</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Not set</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CE & NAR Compliance - Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            {/* Utah CE Compliance */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Utah CE Compliance</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Core</p>
                    <p className="text-2xl font-bold text-gray-900">{agent.ce_core_hours ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Elective</p>
                    <p className="text-2xl font-bold text-gray-900">{agent.ce_elective_hours ?? 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Required Hours</p>
                    <p className="text-sm font-medium text-gray-900">{agent.ce_required_hours ?? 18}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">CE Due Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {agent.ce_due_date ? formatDateOnly(agent.ce_due_date) : <span className="italic text-gray-500">Not set</span>}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Mandatory Class</p>
                  {agent.mandatory_course_completed ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      ✓ Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                      ✗ Not Completed
                    </span>
                  )}
                </div>
                {agent.ce_last_updated && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      Last updated: {new Date(agent.ce_last_updated).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* NAR Compliance */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">NAR Compliance</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Code of Ethics</p>
                  {agent.nar_code_of_ethics_completed || agent.nar_code_of_ethics_date ? (
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        {agent.nar_code_of_ethics_date ? formatDateOnly(agent.nar_code_of_ethics_date) : 'Completed'}
                      </p>
                      {agent.nar_code_of_ethics_cert_url && (
                        <a 
                          href={agent.nar_code_of_ethics_cert_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View certificate
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-red-600">Not completed</p>
                  )}
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Fair Housing</p>
                  {agent.nar_fair_housing_completed || agent.nar_fair_housing_date ? (
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        {agent.nar_fair_housing_date ? formatDateOnly(agent.nar_fair_housing_date) : 'Completed'}
                      </p>
                      {agent.nar_fair_housing_cert_url && (
                        <a 
                          href={agent.nar_fair_housing_cert_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View certificate
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-red-600">Not completed</p>
                  )}
                </div>
                {agent.nar_cycle_end && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Current Cycle Ends</p>
                    <p className="text-sm text-gray-900">
                      {formatDateOnly(agent.nar_cycle_end)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Info */}
          {(agent.date_of_birth || agent.gender) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="space-y-3">
                {agent.date_of_birth && (
                  <div>
                    <p className="text-xs text-gray-600">Date of Birth</p>
                    <p className="text-sm text-gray-900">
                      {formatDateOnly(agent.date_of_birth)}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Age: {Math.floor((new Date().getTime() - parseDateOnly(agent.date_of_birth)!.getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
                    </p>
                  </div>
                )}
                {agent.gender && (
                  <div>
                    <p className="text-xs text-gray-600">Gender</p>
                    <p className="text-sm text-gray-900 capitalize">{agent.gender}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional</h2>
            <div className="space-y-3">
              {agent.primary_board && (
                <div>
                  <p className="text-xs text-gray-600">Primary Board</p>
                  <p className="text-sm text-gray-900">{agent.primary_board}</p>
                </div>
              )}
              {agent.original_license_date && (
                <div>
                  <p className="text-xs text-gray-600">Original License Date</p>
                  <p className="text-sm text-gray-900">
                    {formatDateOnly(agent.original_license_date)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {Math.floor((new Date().getTime() - parseDateOnly(agent.original_license_date)!.getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years licensed
                  </p>
                </div>
              )}
              {agent.current_company && (
                <div>
                  <p className="text-xs text-gray-600">Previous Company</p>
                  <p className="text-sm text-gray-900">{agent.current_company}</p>
                </div>
              )}
              {agent.hire_date && (
                <div>
                  <p className="text-xs text-gray-600">Hire Date</p>
                  <p className="text-sm text-gray-900">
                    {formatDateOnly(agent.hire_date)}
                  </p>
                </div>
              )}
              {agent.listings_at_hire !== null && agent.listings_at_hire !== undefined && (
                <div>
                  <p className="text-xs text-gray-600">Listings at Hire</p>
                  <p className="text-sm text-gray-900">{agent.listings_at_hire}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-600">Portal Status</p>
                <p className="text-sm text-gray-900">{formatPortalStatus(agent.invite_status)}</p>
              </div>
            </div>
          </div>

          {/* Tax/Payment Info */}
          {(agent.payment_method || agent.entity_name || agent.ssn_last_4 || agent.ein) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax & Payment</h2>
              <div className="space-y-3">
                {agent.payment_method && (
                  <div>
                    <p className="text-xs text-gray-600">Payment Method</p>
                    <p className="text-sm text-gray-900 capitalize">{agent.payment_method.replace('_', ' ')}</p>
                  </div>
                )}
                {agent.entity_name && (
                  <div>
                    <p className="text-xs text-gray-600">Entity Name</p>
                    <p className="text-sm text-gray-900">{agent.entity_name}</p>
                  </div>
                )}
                {agent.ssn_last_4 && (
                  <div>
                    <p className="text-xs text-gray-600">SSN</p>
                    <p className="text-sm text-gray-900">***-**-{agent.ssn_last_4}</p>
                  </div>
                )}
                {agent.ein && (
                  <div>
                    <p className="text-xs text-gray-600">EIN</p>
                    <p className="text-sm text-gray-900">{agent.ein}</p>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Active Listings</p>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{activeListings}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Pending Sales</p>
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-600">{pendingSales ?? 0}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Closed Deals</p>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{closedDeals ?? 0}</p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            {!recentTransactions || recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((txn: any) => (
                  <Link
                    key={txn.id}
                    href={`/dashboard/transactions/${txn.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <p className="text-gray-900 font-medium text-sm">{txn.property_address}</p>
                    <p className="text-gray-600 text-xs mt-1 capitalize">
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

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getUserContext } from '@/lib/supabase/get-user-role'
import TransactionComplianceChecklist from './transaction-compliance-checklist'
import { formatPhoneNumber } from '@/lib/phone'

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  // Get user role
  const userContext = await getUserContext()
  if (!userContext) notFound()

  // Fetch transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select(`
      *,
      agent:agents!agent_id(first_name, last_name)
    `)
    .eq('id', id)
    .single() as any

  if (txError || !transaction) {
    notFound()
  }
  
  // Wall of confidentiality: Agents can only access their own transactions
  if (userContext.role === 'agent' && transaction.agent_id !== userContext.agentId) {
    notFound()
  }

  // Fetch compliance items
  const { data: complianceItems } = await supabase
    .from('transaction_compliance_items')
    .select('*')
    .eq('transaction_id', id)
    .order('sort_order', { ascending: true })
    .order('form_name') as any

  const roleLabels: Record<string, string> = {
    listing: 'Listing Agent',
    buyer_agency: 'Buyer\'s Agent',
    limited_agency: 'Limited Agency',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    under_contract: 'Under Contract',
    closed: 'Closed',
    cancelled: 'Cancelled',
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/transactions"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Purchase Contract</h1>
            <p className="text-gray-600">
              {transaction.buyer_first_name} {transaction.buyer_last_name} • {transaction.agent?.first_name} {transaction.agent?.last_name}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/transactions/${id}/edit`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Edit
        </Link>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Details (2/3) */}
        <div className="col-span-2 space-y-6">
          {/* Transaction Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">
              Transaction Details{transaction.file_id && (
                <> for ID# <span className="font-mono">{transaction.file_id}</span></>
              )}
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <span className="text-gray-600">Role:</span>
                <p className="font-medium">{roleLabels[transaction.transaction_type] || transaction.transaction_type}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className="font-medium">{statusLabels[transaction.status] || transaction.status}</p>
              </div>
              <div>
                <span className="text-gray-600">Offer Reference Date:</span>
                <p className="font-medium">
                  {transaction.offer_reference_date ? new Date(transaction.offer_reference_date).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Contract Date:</span>
                <p className="font-medium">
                  {transaction.contract_date ? new Date(transaction.contract_date).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Property */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Property</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="col-span-2">
                <span className="text-gray-600">Address:</span>
                <p className="font-medium">{transaction.property_address || '—'}</p>
                <p className="text-gray-600 text-xs mt-1">
                  {transaction.property_city}, {transaction.property_state} {transaction.property_zip}
                </p>
              </div>
              <div>
                <span className="text-gray-600">County:</span>
                <p className="font-medium">{transaction.county?.replace(' County', '') || '—'}</p>
              </div>
              <div>
                <span className="text-gray-600">Property Type:</span>
                <p className="font-medium capitalize">{transaction.property_type?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Financial</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <span className="text-gray-600">Sales Price:</span>
                <p className="font-medium text-lg">
                  {transaction.purchase_price ? `$${Number(transaction.purchase_price).toLocaleString()}` : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Earnest Money:</span>
                <p className="font-medium">
                  {transaction.earnest_money_amount ? `$${Number(transaction.earnest_money_amount).toLocaleString()}` : '—'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Earnest Money Held By:</span>
                <p className="font-medium">
                  {transaction.earnest_money_location === 'buyer_title' ? "Buyer's Title Company" :
                   transaction.earnest_money_location === 'seller_title' ? "Seller's Title Company" :
                   transaction.earnest_money_location === 'buyer_broker' ? "Buyer's Broker" :
                   transaction.earnest_money_location === 'listing_broker' ? 'Listing Broker' :
                   transaction.earnest_money_location === 'other' ? (transaction.earnest_money_held_by || 'Other') : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Parties</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Buyer</h3>
                <p className="font-medium">{transaction.buyer_first_name} {transaction.buyer_last_name}</p>
                {transaction.buyer_email && <p className="text-sm text-gray-600">{transaction.buyer_email}</p>}
                {transaction.buyer_phone && <p className="text-sm text-gray-600">{formatPhoneNumber(transaction.buyer_phone)}</p>}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Seller</h3>
                <p className="font-medium">{transaction.seller_first_name || '—'} {transaction.seller_last_name || ''}</p>
                {transaction.seller_email && <p className="text-sm text-gray-600">{transaction.seller_email}</p>}
                {transaction.seller_phone && <p className="text-sm text-gray-600">{formatPhoneNumber(transaction.seller_phone)}</p>}
              </div>
              {transaction.cooperating_brokerage && (
                <div className="col-span-2 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Cooperating Broker</h3>
                  <p className="font-medium">{transaction.cooperating_brokerage}</p>
                  {transaction.cooperating_agent_name && <p className="text-sm text-gray-600">{transaction.cooperating_agent_name}</p>}
                  {transaction.cooperating_agent_phone && <p className="text-sm text-gray-600">{formatPhoneNumber(transaction.cooperating_agent_phone)}</p>}
                  {transaction.cooperating_agent_email && <p className="text-sm text-gray-600">{transaction.cooperating_agent_email}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Title Companies */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Title Companies</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Buyer's Title Company</h3>
                {transaction.buyer_title_company ? (
                  <>
                    <p className="font-medium">{transaction.buyer_title_company}</p>
                    {transaction.buyer_title_contact_name && <p className="text-sm text-gray-600">{transaction.buyer_title_contact_name}</p>}
                    {transaction.buyer_title_contact_phone && <p className="text-sm text-gray-600">{formatPhoneNumber(transaction.buyer_title_contact_phone)}</p>}
                    {transaction.buyer_title_contact_email && <p className="text-sm text-gray-600">{transaction.buyer_title_contact_email}</p>}
                  </>
                ) : (
                  <p className="text-gray-400 italic">Not specified</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Seller's Title Company</h3>
                {transaction.seller_title_company ? (
                  <>
                    <p className="font-medium">{transaction.seller_title_company}</p>
                    {transaction.seller_title_contact_name && <p className="text-sm text-gray-600">{transaction.seller_title_contact_name}</p>}
                    {transaction.seller_title_contact_phone && <p className="text-sm text-gray-600">{formatPhoneNumber(transaction.seller_title_contact_phone)}</p>}
                    {transaction.seller_title_contact_email && <p className="text-sm text-gray-600">{transaction.seller_title_contact_email}</p>}
                  </>
                ) : (
                  <p className="text-gray-400 italic">Not specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 24 Deadlines */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Section 24 Deadlines</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <span className="text-gray-600">(a) Seller Disclosure:</span>
                <p className="font-medium">
                  {transaction.seller_disclosure_deadline ? new Date(transaction.seller_disclosure_deadline).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">(b) Due Diligence:</span>
                <p className="font-medium">
                  {transaction.due_diligence_deadline ? new Date(transaction.due_diligence_deadline).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">(c) Financing & Appraisal:</span>
                <p className="font-medium">
                  {transaction.financing_appraisal_deadline ? new Date(transaction.financing_appraisal_deadline).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">(d) Settlement:</span>
                <p className="font-medium">
                  {transaction.settlement_deadline ? new Date(transaction.settlement_deadline).toLocaleDateString() : '—'}
                </p>
              </div>
              {transaction.custom_deadline_1_label && (
                <div>
                  <span className="text-gray-600">{transaction.custom_deadline_1_label}:</span>
                  <p className="font-medium">
                    {transaction.custom_deadline_1_date ? new Date(transaction.custom_deadline_1_date).toLocaleDateString() : '—'}
                  </p>
                </div>
              )}
              {transaction.custom_deadline_2_label && (
                <div>
                  <span className="text-gray-600">{transaction.custom_deadline_2_label}:</span>
                  <p className="font-medium">
                    {transaction.custom_deadline_2_date ? new Date(transaction.custom_deadline_2_date).toLocaleDateString() : '—'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Compliance (1/3) */}
        <div className="col-span-1">
          <div className="sticky top-6">
            <TransactionComplianceChecklist 
              transactionId={id}
              items={complianceItems || []}
              canEdit={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

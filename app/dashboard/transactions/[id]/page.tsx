import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { TransactionDocument, TrackingType, TransactionStatus } from '@/types/database'
import { ArrowLeft, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import StatusUpdater from './status-updater'
import { getUserContext } from '@/lib/supabase/get-user-role'

const statusColors: Record<TransactionStatus, string> = {
  active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  under_contract: 'bg-green-500/20 text-green-400 border-green-500/30',
  closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const trackingBadges: Record<TrackingType, { label: string; className: string }> = {
  pdf_auto: { label: 'Auto', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  manual_checkbox: { label: 'Manual', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  manual_upload: { label: 'Upload', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  inherited: { label: 'Inherited', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  optional_any: { label: 'Optional', className: 'bg-slate-600/20 text-slate-500 border-slate-600/30' },
}

const propTypeLabels: Record<string, string> = {
  residential: 'Residential',
  vacant_land: 'Vacant Land',
  mobile_home: 'Mobile Home',
  commercial: 'Commercial',
  multi_unit: 'Multi-Unit',
  farm: 'Farm',
  residential_lease: 'Residential Lease',
}

const txTypeLabels: Record<string, string> = {
  listing: 'Listing',
  buyer_agency: 'Buyer Agency',
  seller_purchase: 'Seller / Purchase',
  buyer_purchase: 'Buyer / Purchase',
  unrepresented_buyer: 'Unrepresented Buyer',
  fsbo_purchase: 'FSBO Purchase',
}

const receivedViaLabels: Record<string, string> = {
  gmail_watch: 'via Gmail',
  email_submission: 'via Gmail',
  manual_upload: 'via Upload',
}

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
    .select('*')
    .eq('id', id)
    .single() as any

  if (txError || !transaction) {
    notFound()
  }
  
  // Wall of confidentiality: Agents can only access their own transactions
  if (userContext.role === 'agent' && transaction.agent_id !== userContext.agentId) {
    notFound()
  }

  // Find matching compliance template (system defaults: broker_id IS NULL)
  const { data: template } = await supabase
    .from('compliance_templates')
    .select('id')
    .eq('property_type', transaction.property_type)
    .eq('transaction_type', transaction.transaction_type)
    .is('broker_id', null)
    .single() as any

  // Fetch template forms
  const { data: forms } = template
    ? await supabase
        .from('template_forms')
        .select('*')
        .eq('template_id', template.id)
        .order('sort_order', { ascending: true }) as any
    : { data: [] }

  // Fetch all documents for this transaction
  const { data: allDocuments } = await supabase
    .from('transaction_documents')
    .select('*')
    .eq('transaction_id', id)
    .order('received_at', { ascending: false }) as any

  // Build doc map (form_identifier → document)
  const docMap = new Map<string, TransactionDocument>()
  allDocuments?.forEach(doc => {
    if (!docMap.has(doc.form_identifier)) {
      docMap.set(doc.form_identifier, doc)
    }
  })

  // Unmatched documents (not in any template form)
  const templateFormIds = new Set(forms?.map(f => f.form_identifier) ?? [])
  const unmatchedDocs = allDocuments?.filter(doc => !templateFormIds.has(doc.form_identifier)) ?? []

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/transactions"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Transactions
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {transaction.client_last_name}, {transaction.client_first_name}
            </h1>
            <p className="text-slate-400 mt-1">
              {transaction.property_address ?? <span className="italic">No address yet</span>}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[transaction.status]}`}>
                {transaction.status.replace(/_/g, ' ')}
              </span>
              <span className="text-slate-500 text-xs">
                {propTypeLabels[transaction.property_type]} · {txTypeLabels[transaction.transaction_type]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/transactions/${transaction.id}/edit`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Edit
            </Link>
            <StatusUpdater 
              transactionId={transaction.id} 
              currentStatus={transaction.status} 
              userRole={userContext.role}
            />
          </div>
        </div>
      </div>

      {/* REPC Summary */}
      <section className="mb-8">
        <h2 className="text-white font-semibold text-lg mb-4">REPC Summary</h2>
        
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Key Dates */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Key Dates</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Offer Reference Date:</span>
                  <span className="text-white text-sm font-medium">
                    {transaction.offer_reference_date ? new Date(transaction.offer_reference_date).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Contract Date:</span>
                  <span className="text-white text-sm font-medium">
                    {transaction.contract_date ? new Date(transaction.contract_date).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Financial</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Purchase Price:</span>
                  <span className="text-white text-sm font-medium">
                    {transaction.purchase_price ? `$${Number(transaction.purchase_price).toLocaleString()}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Earnest Money:</span>
                  <span className="text-white text-sm font-medium">
                    {transaction.earnest_money_amount ? `$${Number(transaction.earnest_money_amount).toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cooperating Broker */}
          {(transaction.cooperating_brokerage || transaction.cooperating_agent_name || transaction.cooperating_agent_phone || transaction.cooperating_agent_email) && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">
                {transaction.agency_role === 'listing_agent' ? "Buyer's Agent (Cooperating Broker)" : 
                 transaction.agency_role === 'buyer_agent' ? "Listing Agent (Cooperating Broker)" :
                 "Other Agent (Cooperating Broker)"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {transaction.cooperating_brokerage && (
                  <div>
                    <span className="text-slate-400 text-xs">Brokerage:</span>
                    <p className="text-white text-sm mt-1">{transaction.cooperating_brokerage}</p>
                  </div>
                )}
                {transaction.cooperating_agent_name && (
                  <div>
                    <span className="text-slate-400 text-xs">Agent:</span>
                    <p className="text-white text-sm mt-1">{transaction.cooperating_agent_name}</p>
                  </div>
                )}
                {transaction.cooperating_agent_phone && (
                  <div>
                    <span className="text-slate-400 text-xs">Phone:</span>
                    <p className="text-white text-sm mt-1">
                      <a href={`tel:${transaction.cooperating_agent_phone}`} className="text-blue-400 hover:text-blue-300">
                        {transaction.cooperating_agent_phone}
                      </a>
                    </p>
                  </div>
                )}
                {transaction.cooperating_agent_email && (
                  <div>
                    <span className="text-slate-400 text-xs">Email:</span>
                    <p className="text-white text-sm mt-1">
                      <a href={`mailto:${transaction.cooperating_agent_email}`} className="text-blue-400 hover:text-blue-300">
                        {transaction.cooperating_agent_email}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title Companies */}
          {(transaction.buyer_title_company || transaction.seller_title_company) && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Title Companies</h3>
              <div className="grid grid-cols-2 gap-4">
                {transaction.buyer_title_company && (
                  <div>
                    <span className="text-slate-400 text-xs">Buyer Title Company:</span>
                    <p className="text-white text-sm mt-1">{transaction.buyer_title_company}</p>
                  </div>
                )}
                {transaction.seller_title_company && (
                  <div>
                    <span className="text-slate-400 text-xs">Seller Title Company:</span>
                    <p className="text-white text-sm mt-1">{transaction.seller_title_company}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Earnest Money Details */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Earnest Money Holder</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-xs">Location:</span>
                <p className="text-white text-sm mt-1">
                  {transaction.earnest_money_location === 'buyer_title_company' ? 'Buyer Title Company' :
                   transaction.earnest_money_location === 'seller_title_company' ? 'Seller Title Company' :
                   transaction.earnest_money_location === 'buyer_broker' ? "Buyer's Broker" :
                   transaction.earnest_money_location === 'listing_broker' ? 'Listing Broker' :
                   transaction.earnest_money_location === 'other' ? (transaction.earnest_money_location_other || 'Other') : '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Held By:</span>
                <p className="text-white text-sm mt-1">{transaction.earnest_money_held_by || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Contact:</span>
                <p className="text-white text-sm mt-1">{transaction.earnest_money_contact_name || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Email:</span>
                <p className="text-white text-sm mt-1">{transaction.earnest_money_contact_email || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Phone:</span>
                <p className="text-white text-sm mt-1">{transaction.earnest_money_contact_phone || '—'}</p>
              </div>
            </div>
          </div>

          {/* Section 24 Deadlines */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Section 24 Deadlines</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-xs">Seller Disclosure (24a):</span>
                <p className="text-white text-sm mt-1">
                  {transaction.seller_disclosure_deadline ? new Date(transaction.seller_disclosure_deadline).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Due Diligence (24b):</span>
                <p className="text-white text-sm mt-1">
                  {transaction.due_diligence_deadline ? new Date(transaction.due_diligence_deadline).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Finance & Appraisal (24c):</span>
                <p className="text-white text-sm mt-1">
                  {transaction.finance_appraisal_deadline ? new Date(transaction.finance_appraisal_deadline).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Settlement (24d):</span>
                <p className="text-white text-sm mt-1 font-semibold">
                  {transaction.settlement_deadline ? new Date(transaction.settlement_deadline).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Custom Deadlines */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Additional Deadlines</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-xs">{transaction.custom_deadline_1_label || 'Custom Deadline 1'}:</span>
                <p className="text-white text-sm mt-1">
                  {transaction.custom_deadline_1_date ? new Date(transaction.custom_deadline_1_date).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">{transaction.custom_deadline_2_label || 'Custom Deadline 2'}:</span>
                <p className="text-white text-sm mt-1">
                  {transaction.custom_deadline_2_date ? new Date(transaction.custom_deadline_2_date).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Limited Agency Disclosure */}
          {transaction.agency_role === 'limited_agency' && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-3">
                {transaction.limited_agency_disclosure_received ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Limited Agency Disclosure Received</p>
                      <p className="text-slate-400 text-xs mt-0.5">Signed and dated by offer reference date</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <div>
                      <p className="text-orange-400 text-sm font-medium">Limited Agency Disclosure Required</p>
                      <p className="text-orange-300/70 text-xs mt-0.5">Must be signed and dated no later than the offer reference date</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Compliance Checklist */}
      <section className="mb-8">
        <h2 className="text-white font-semibold text-lg mb-4">Compliance Checklist</h2>

        {!forms || forms.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No compliance template found for this transaction type.</p>
            <p className="text-slate-500 text-sm mt-1">
              {propTypeLabels[transaction.property_type]} · {txTypeLabels[transaction.transaction_type]}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-700">
              {forms.map(form => {
                const doc = docMap.get(form.form_identifier)
                const badge = trackingBadges[form.tracking_type as TrackingType]
                return (
                  <div key={form.id} className="flex items-start gap-4 px-5 py-4">
                    {/* Status icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {doc ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    {/* Form info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${doc ? 'text-white' : 'text-slate-300'}`}>
                          {form.form_name}
                        </span>
                        <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${badge.className}`}>
                          {badge.label}
                        </span>
                        {form.is_required && (
                          <span className="text-xs text-red-400">Required</span>
                        )}
                      </div>

                      {doc ? (
                        <div className="mt-1 flex items-center gap-3 flex-wrap">
                          <span className="text-slate-400 text-xs truncate max-w-xs">
                            {doc.original_filename ?? doc.form_name}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Date(doc.received_at).toLocaleDateString()}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {receivedViaLabels[doc.received_via] ?? doc.received_via}
                          </span>
                          {doc.ai_confidence !== null && (
                            <span className="text-slate-500 text-xs">
                              {Math.round(doc.ai_confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-600 text-xs mt-1">Not received</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Extra / Unmatched Documents */}
      {unmatchedDocs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-white font-semibold text-lg mb-4">Additional Documents</h2>
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-700">
              {unmatchedDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-sm truncate">
                      {doc.original_filename ?? doc.form_name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {doc.ai_identified_as && (
                        <span className="text-slate-400 text-xs">{doc.ai_identified_as}</span>
                      )}
                      <span className="text-slate-500 text-xs">
                        {new Date(doc.received_at).toLocaleDateString()}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {receivedViaLabels[doc.received_via] ?? doc.received_via}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

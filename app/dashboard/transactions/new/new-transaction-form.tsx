'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewTransactionForm({ brokerId, agents, agency, currentAgentId, isAgent }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Pre-fill from agency if provided
  const initialData = agency ? {
    agency_agreement_id: agency.id,
    agent_id: agency.agent_id || currentAgentId || '',
    property_address: agency.property_address || '',
    property_city: agency.property_city || '',
    property_state: agency.property_state || 'UT',
    property_zip: agency.property_zip || '',
    property_type: agency.property_type || 'residential',
    // Seller from listing, buyer from buyer agency
    seller_first_name: agency.agreement_type === 'listing_agreement' ? agency.client_first_name : '',
    seller_last_name: agency.agreement_type === 'listing_agreement' ? agency.client_last_name : '',
    seller_email: agency.agreement_type === 'listing_agreement' ? agency.client_email : '',
    seller_phone: agency.agreement_type === 'listing_agreement' ? agency.client_phone : '',
    buyer_first_name: agency.agreement_type === 'buyer_agency_agreement' ? agency.client_first_name : '',
    buyer_last_name: agency.agreement_type === 'buyer_agency_agreement' ? agency.client_last_name : '',
    buyer_email: agency.agreement_type === 'buyer_agency_agreement' ? agency.client_email : '',
    buyer_phone: agency.agreement_type === 'buyer_agency_agreement' ? agency.client_phone : '',
    agency_role: agency.agreement_type === 'listing_agreement' ? 'listing_agent' : 'buyer_agent',
  } : {}

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const data: any = {
      broker_id: brokerId,
      agent_id: formData.get('agent_id'),
      agency_agreement_id: formData.get('agency_agreement_id') || null,
      transaction_type: formData.get('transaction_type'),
      property_type: formData.get('property_type'),
      agency_role: formData.get('agency_role'),
      property_address: formData.get('property_address'),
      property_city: formData.get('property_city'),
      property_state: formData.get('property_state'),
      property_zip: formData.get('property_zip'),
      buyer_first_name: formData.get('buyer_first_name'),
      buyer_last_name: formData.get('buyer_last_name'),
      buyer_email: formData.get('buyer_email') || null,
      buyer_phone: formData.get('buyer_phone') || null,
      seller_first_name: formData.get('seller_first_name') || null,
      seller_last_name: formData.get('seller_last_name') || null,
      seller_email: formData.get('seller_email') || null,
      seller_phone: formData.get('seller_phone') || null,
      purchase_price: formData.get('purchase_price') || null,
      offer_reference_date: formData.get('offer_reference_date'),
      contract_date: formData.get('contract_date'),
      earnest_money_amount: formData.get('earnest_money_amount') || null,
      earnest_money_location: formData.get('earnest_money_location') || null,
      earnest_money_held_by: formData.get('earnest_money_held_by') || null,
      earnest_money_contact_name: formData.get('earnest_money_contact_name') || null,
      earnest_money_contact_email: formData.get('earnest_money_contact_email') || null,
      earnest_money_contact_phone: formData.get('earnest_money_contact_phone') || null,
      seller_disclosure_deadline: formData.get('seller_disclosure_deadline') || null,
      due_diligence_deadline: formData.get('due_diligence_deadline') || null,
      finance_appraisal_deadline: formData.get('finance_appraisal_deadline') || null,
      settlement_deadline: formData.get('settlement_deadline'),
      custom_deadline_1_label: formData.get('custom_deadline_1_label') || null,
      custom_deadline_1_date: formData.get('custom_deadline_1_date') || null,
      custom_deadline_2_label: formData.get('custom_deadline_2_label') || null,
      custom_deadline_2_date: formData.get('custom_deadline_2_date') || null,
      status: 'pending'
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(data)
      .select()
      .single() as any

    if (error) {
      alert('Error creating transaction: ' + error.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/transactions/${transaction.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="agency_agreement_id" value={initialData.agency_agreement_id || ''} />

      {agency && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            Creating transaction from <strong>{agency.agreement_type === 'listing_agreement' ? 'Listing Agreement' : 'Buyer Agency Agreement'}</strong> for {agency.client_first_name} {agency.client_last_name}
          </p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Transaction Type</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Transaction</label>
            <select name="transaction_type" className="w-full px-3 py-2 border rounded-lg" required defaultValue="purchase">
              <option value="purchase">Purchase</option>
              <option value="lease">Lease</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Your Role</label>
            <select name="agency_role" className="w-full px-3 py-2 border rounded-lg" required defaultValue={initialData.agency_role || 'buyer_agent'}>
              <option value="listing_agent">Listing Agent (Seller)</option>
              <option value="buyer_agent">Buyer's Agent</option>
              <option value="dual_agency">Dual Agency</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Agent</label>
            <select 
              name="agent_id" 
              className="w-full px-3 py-2 border rounded-lg" 
              required 
              defaultValue={initialData.agent_id || currentAgentId || ''}
              disabled={isAgent}
            >
              <option value="">Select agent...</option>
              {agents.map((agent: any) => (
                <option key={agent.id} value={agent.id}>
                  {agent.first_name} {agent.last_name}
                </option>
              ))}
            </select>
            {isAgent && (
              <p className="text-xs text-slate-500 mt-1">This transaction will be assigned to you</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Property</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">Address</label>
          <input
            type="text"
            name="property_address"
            className="w-full px-3 py-2 border rounded-lg"
            required
            defaultValue={initialData.property_address || ''}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <input
              type="text"
              name="property_city"
              className="w-full px-3 py-2 border rounded-lg"
              required
              defaultValue={initialData.property_city || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">State</label>
            <input
              type="text"
              name="property_state"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={initialData.property_state || 'UT'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">ZIP</label>
            <input
              type="text"
              name="property_zip"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={initialData.property_zip || ''}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Property Type</label>
          <select name="property_type" className="w-full px-3 py-2 border rounded-lg" required defaultValue={initialData.property_type || 'residential'}>
            <option value="residential">Residential</option>
            <option value="vacant_land">Vacant Land</option>
            <option value="mobile_home">Mobile Home</option>
            <option value="commercial">Commercial</option>
            <option value="multi_unit">Multi-Unit</option>
            <option value="farm">Farm</option>
            <option value="residential_lease">Residential Lease</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Buyer</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              name="buyer_first_name"
              className="w-full px-3 py-2 border rounded-lg"
              required
              defaultValue={initialData.buyer_first_name || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              name="buyer_last_name"
              className="w-full px-3 py-2 border rounded-lg"
              required
              defaultValue={initialData.buyer_last_name || ''}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="buyer_email"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={initialData.buyer_email || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="buyer_phone"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={initialData.buyer_phone || ''}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Seller</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              name="seller_first_name"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={initialData.seller_first_name || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              name="seller_last_name"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={initialData.seller_last_name || ''}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="seller_email"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={initialData.seller_email || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="seller_phone"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={initialData.seller_phone || ''}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">REPC Summary</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Offer Reference Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="offer_reference_date"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <p className="text-xs text-slate-500 mt-1">REPC front page - before acceptance</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Contract Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="contract_date"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Date accepted/signed by all parties</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Purchase Price</label>
            <input
              type="number"
              name="purchase_price"
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="$"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Earnest Money Amount</label>
            <input
              type="number"
              name="earnest_money_amount"
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="$"
            />
            <p className="text-xs text-slate-500 mt-1">Due within 4 days of contract date</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Where is the Earnest Money?</label>
          <select name="earnest_money_location" className="w-full px-3 py-2 border rounded-lg">
            <option value="">Select location...</option>
            <option value="title_company">Title Company</option>
            <option value="buyer_broker">Buyer's Broker</option>
            <option value="listing_broker">Listing Broker</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Where the earnest money deposit is being held</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Held By (Company/Brokerage Name)</label>
          <input
            type="text"
            name="earnest_money_held_by"
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g., First American Title, Smith Realty"
          />
          <p className="text-xs text-slate-500 mt-1">Name of title company or brokerage</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Contact Person</label>
            <input
              type="text"
              name="earnest_money_contact_name"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Contact name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Email</label>
            <input
              type="email"
              name="earnest_money_contact_email"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="email@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Phone</label>
            <input
              type="tel"
              name="earnest_money_contact_phone"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="(801) 555-1234"
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-3">Section 24 Deadlines</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Seller Disclosure Deadline</label>
            <input
              type="date"
              name="seller_disclosure_deadline"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-slate-500 mt-1">Section 24(a)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Due Diligence Deadline</label>
            <input
              type="date"
              name="due_diligence_deadline"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-slate-500 mt-1">Section 24(b)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Finance & Appraisal Deadline</label>
            <input
              type="date"
              name="finance_appraisal_deadline"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-slate-500 mt-1">Section 24(c)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Settlement Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="settlement_deadline"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Section 24(d)</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-700 mt-6 mb-3">Additional Deadlines (Optional)</h3>
        <p className="text-xs text-slate-500 mb-3">For contingencies in addendums or special conditions</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Deadline Name</label>
            <input
              type="text"
              name="custom_deadline_1_label"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., HOA Approval, Septic Inspection"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              name="custom_deadline_1_date"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Deadline Name</label>
            <input
              type="text"
              name="custom_deadline_2_label"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Well Test, Zoning Approval"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              name="custom_deadline_2_date"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Transaction'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

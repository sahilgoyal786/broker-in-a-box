'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewTransactionForm({ brokerId, agents, currentAgentId, isAgent, prefillData }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [transactionType, setTransactionType] = useState(prefillData?.transaction_type || '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const data: any = {
      broker_id: brokerId,
      agent_id: formData.get('agent_id') || currentAgentId,
      property_address: formData.get('property_address'),
      property_city: formData.get('property_city'),
      property_state: formData.get('property_state'),
      property_zip: formData.get('property_zip'),
      county: formData.get('county') || null,
      property_type: formData.get('property_type'),
      transaction_type: formData.get('transaction_type'),
      contract_type: formData.get('contract_type'),
      contract_date: formData.get('contract_date'),
      original_list_price: formData.get('original_list_price') || null,
      current_list_price: formData.get('current_list_price') || null,
      purchase_price: formData.get('purchase_price') || null,
      earnest_money_amount: formData.get('earnest_money_amount') || null,
      earnest_money_location: formData.get('earnest_money_location') || null,
      earnest_money_held_by: formData.get('earnest_money_held_by') || null,
      earnest_money_contact_name: formData.get('earnest_money_contact_name') || null,
      earnest_money_contact_email: formData.get('earnest_money_contact_email') || null,
      earnest_money_contact_phone: formData.get('earnest_money_contact_phone') || null,
      seller_title_company: formData.get('seller_title_company') || null,
      seller_title_contact_name: formData.get('seller_title_contact_name') || null,
      seller_title_contact_email: formData.get('seller_title_contact_email') || null,
      seller_title_contact_phone: formData.get('seller_title_contact_phone') || null,
      buyer_title_company: formData.get('buyer_title_company') || null,
      buyer_title_contact_name: formData.get('buyer_title_contact_name') || null,
      buyer_title_contact_email: formData.get('buyer_title_contact_email') || null,
      buyer_title_contact_phone: formData.get('buyer_title_contact_phone') || null,
      inspection_deadline: formData.get('inspection_deadline') || null,
      loan_approval_deadline: formData.get('loan_approval_deadline') || null,
      appraisal_deadline: formData.get('appraisal_deadline') || null,
      buyer_property_sale_deadline: formData.get('buyer_property_sale_deadline') || null,
      custom_deadline_1_label: formData.get('custom_deadline_1_label') || null,
      custom_deadline_1_date: formData.get('custom_deadline_1_date') || null,
      custom_deadline_2_label: formData.get('custom_deadline_2_label') || null,
      custom_deadline_2_date: formData.get('custom_deadline_2_date') || null,
      anticipated_closing_date: formData.get('anticipated_closing_date') || null,
      buyer_first_name: formData.get('buyer_first_name'),
      buyer_last_name: formData.get('buyer_last_name'),
      buyer_email: formData.get('buyer_email') || null,
      buyer_phone: formData.get('buyer_phone') || null,
      seller_first_name: formData.get('seller_first_name'),
      seller_last_name: formData.get('seller_last_name'),
      seller_email: formData.get('seller_email') || null,
      seller_phone: formData.get('seller_phone') || null,
      status: 'pending',
      client_first_name: formData.get('buyer_first_name'), // Required field
      client_last_name: formData.get('buyer_last_name'), // Required field
    }

    const { data: transaction, error: insertError } = await supabase
      .from('transactions')
      .insert(data)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/transactions/${transaction.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Transaction Type</h2>
        
        {!isAgent && (
          <div>
            <label className="block text-sm font-medium mb-2">Agent</label>
            <select
              name="agent_id"
              required
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={prefillData?.agent_id || ''}
            >
              <option value="">Select agent...</option>
              {agents.map((agent: any) => (
                <option key={agent.id} value={agent.id}>
                  {agent.first_name} {agent.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Your Role</label>
          <select 
            name="transaction_type" 
            required
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select your role...</option>
            <option value="listing">Listing Agent (Representing Seller)</option>
            <option value="buyer_agency">Buyer's Agent (Representing Buyer)</option>
            <option value="limited_agency">Limited Agency - Buyer/Seller</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Property Type</label>
          <select 
            name="property_type" 
            required
            className="w-full px-3 py-2 border rounded-lg"
            defaultValue={prefillData?.property_type || ''}
          >
            <option value="">Select type...</option>
            <option value="residential">Residential</option>
            <option value="vacant_land">Vacant Land</option>
            <option value="mobile_home">Mobile Home</option>
            <option value="commercial">Commercial</option>
            <option value="multi_unit">Multi-Unit</option>
            <option value="farm">Farm</option>
            <option value="residential_lease">Residential Lease</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Contract Type</label>
          <select 
            name="contract_type" 
            required
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select type...</option>
            <option value="purchase">Purchase</option>
            <option value="lease">Lease</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Buyer Information</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              name="buyer_first_name"
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              name="buyer_last_name"
              required
              className="w-full px-3 py-2 border rounded-lg"
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="buyer_phone"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Seller Information</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              name="seller_first_name"
              required
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={prefillData?.seller_first_name || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              name="seller_last_name"
              required
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={prefillData?.seller_last_name || ''}
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
              defaultValue={prefillData?.seller_email || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="seller_phone"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={prefillData?.seller_phone || ''}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Property Information</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">Property Address</label>
          <input
            type="text"
            name="property_address"
            required
            className="w-full px-3 py-2 border rounded-lg"
            defaultValue={prefillData?.property_address || ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">County</label>
          <select
            name="county"
            className="w-full px-3 py-2 border rounded-lg"
            defaultValue={prefillData?.county || ''}
          >
            <option value="">Select county...</option>
            <option value="Beaver County">Beaver</option>
            <option value="Box Elder County">Box Elder</option>
            <option value="Cache County">Cache</option>
            <option value="Carbon County">Carbon</option>
            <option value="Daggett County">Daggett</option>
            <option value="Davis County">Davis</option>
            <option value="Duchesne County">Duchesne</option>
            <option value="Emery County">Emery</option>
            <option value="Garfield County">Garfield</option>
            <option value="Grand County">Grand</option>
            <option value="Iron County">Iron</option>
            <option value="Juab County">Juab</option>
            <option value="Kane County">Kane</option>
            <option value="Millard County">Millard</option>
            <option value="Morgan County">Morgan</option>
            <option value="Piute County">Piute</option>
            <option value="Rich County">Rich</option>
            <option value="Salt Lake County">Salt Lake</option>
            <option value="San Juan County">San Juan</option>
            <option value="Sanpete County">Sanpete</option>
            <option value="Sevier County">Sevier</option>
            <option value="Summit County">Summit</option>
            <option value="Tooele County">Tooele</option>
            <option value="Uintah County">Uintah</option>
            <option value="Utah County">Utah</option>
            <option value="Wasatch County">Wasatch</option>
            <option value="Washington County">Washington</option>
            <option value="Wayne County">Wayne</option>
            <option value="Weber County">Weber</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">City</label>
            <input
              type="text"
              name="property_city"
              className="w-full px-3 py-2 border rounded-lg"
              defaultValue={prefillData?.property_city || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">State</label>
            <input
              type="text"
              name="property_state"
              defaultValue={prefillData?.property_state || "UT"}
              maxLength={2}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">ZIP</label>
          <input
            type="text"
            name="property_zip"
            className="w-full px-3 py-2 border rounded-lg"
            defaultValue={prefillData?.property_zip || ''}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Contract Details</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Contract Date</label>
            <input
              type="date"
              name="contract_date"
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Anticipated Closing Date</label>
            <input
              type="date"
              name="anticipated_closing_date"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Show list prices only if listing agent or limited agency */}
        {transactionType && (transactionType === 'listing' || transactionType === 'limited_agency') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Original List Price</label>
              <input
                type="number"
                name="original_list_price"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0.00"
                defaultValue={prefillData?.current_list_price || ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current List Price</label>
              <input
                type="number"
                name="current_list_price"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0.00"
                defaultValue={prefillData?.current_list_price || ''}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sales Price</label>
            <input
              type="number"
              name="purchase_price"
              step="0.01"
              required
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Earnest Money Amount</label>
            <input
              type="number"
              name="earnest_money_amount"
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Where is Earnest Money Held?</label>
          <select 
            name="earnest_money_location" 
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select location...</option>
            <option value="buyer_title">Buyer's Title Company</option>
            <option value="seller_title">Seller's Title Company</option>
            <option value="buyer_broker">Buyer's Broker</option>
            <option value="listing_broker">Listing Broker</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Held By (Company Name)</label>
            <input
              type="text"
              name="earnest_money_held_by"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., First American Title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Person</label>
            <input
              type="text"
              name="earnest_money_contact_name"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Contact Email</label>
            <input
              type="email"
              name="earnest_money_contact_email"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Phone</label>
            <input
              type="tel"
              name="earnest_money_contact_phone"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Seller's Title Company</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input
              type="text"
              name="seller_title_company"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Person</label>
            <input
              type="text"
              name="seller_title_contact_name"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="seller_title_contact_email"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="seller_title_contact_phone"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Buyer's Title Company</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input
              type="text"
              name="buyer_title_company"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Person</label>
            <input
              type="text"
              name="buyer_title_contact_name"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="buyer_title_contact_email"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="buyer_title_contact_phone"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Section 24 Deadlines</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Inspection Deadline</label>
            <input
              type="date"
              name="inspection_deadline"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Loan Approval Deadline</label>
            <input
              type="date"
              name="loan_approval_deadline"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Appraisal Deadline</label>
            <input
              type="date"
              name="appraisal_deadline"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sale of Buyer's Property Deadline</label>
            <input
              type="date"
              name="buyer_property_sale_deadline"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <h3 className="text-md font-semibold mt-4 pt-4 border-t">Additional Custom Deadlines</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Custom Deadline 1 Name</label>
            <input
              type="text"
              name="custom_deadline_1_label"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., HOA Approval"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Custom Deadline 1 Date</label>
            <input
              type="date"
              name="custom_deadline_1_date"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Custom Deadline 2 Name</label>
            <input
              type="text"
              name="custom_deadline_2_label"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Survey Completion"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Custom Deadline 2 Date</label>
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
          {loading ? 'Creating...' : 'Create Purchase Contract'}
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

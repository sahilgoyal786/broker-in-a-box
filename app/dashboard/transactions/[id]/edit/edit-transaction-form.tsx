'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditTransactionForm({ transaction, agents, isAgent }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showLimitedAgency, setShowLimitedAgency] = useState(transaction.transaction_type === 'limited_agency')
  const [agencyRole, setAgencyRole] = useState(transaction.transaction_type)
  const [earnestMoneyLocation, setEarnestMoneyLocation] = useState(transaction.earnest_money_location || '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const data: any = {
      agent_id: formData.get('agent_id'),
      transaction_type: formData.get('transaction_type'),
      property_type: formData.get('property_type'),
      limited_agency_disclosure_received: formData.get('limited_agency_disclosure_received') === 'on',
      property_address: formData.get('property_address'),
      property_city: formData.get('property_city'),
      property_state: formData.get('property_state'),
      property_zip: formData.get('property_zip'),
      county: formData.get('county') || null,
      buyer_first_name: formData.get('buyer_first_name'),
      buyer_last_name: formData.get('buyer_last_name'),
      buyer_email: formData.get('buyer_email') || null,
      buyer_phone: formData.get('buyer_phone') || null,
      seller_first_name: formData.get('seller_first_name') || null,
      seller_last_name: formData.get('seller_last_name') || null,
      seller_email: formData.get('seller_email') || null,
      seller_phone: formData.get('seller_phone') || null,
      cooperating_brokerage: formData.get('cooperating_brokerage') || null,
      cooperating_agent_name: formData.get('cooperating_agent_name') || null,
      cooperating_agent_phone: formData.get('cooperating_agent_phone') || null,
      cooperating_agent_email: formData.get('cooperating_agent_email') || null,
      purchase_price: formData.get('purchase_price') || null,
      offer_reference_date: formData.get('offer_reference_date'),
      contract_date: formData.get('contract_date'),
      earnest_money_amount: formData.get('earnest_money_amount') || null,
      earnest_money_location: formData.get('earnest_money_location') || null,
      earnest_money_location_other: formData.get('earnest_money_location_other') || null,
      seller_title_company: formData.get('seller_title_company') || null,
      seller_title_contact_name: formData.get('seller_title_contact_name') || null,
      seller_title_contact_email: formData.get('seller_title_contact_email') || null,
      seller_title_contact_phone: formData.get('seller_title_contact_phone') || null,
      buyer_title_company: formData.get('buyer_title_company') || null,
      buyer_title_contact_name: formData.get('buyer_title_contact_name') || null,
      buyer_title_contact_email: formData.get('buyer_title_contact_email') || null,
      buyer_title_contact_phone: formData.get('buyer_title_contact_phone') || null,
      seller_disclosure_deadline: formData.get('seller_disclosure_deadline') || null,
      due_diligence_deadline: formData.get('due_diligence_deadline') || null,
      finance_appraisal_deadline: formData.get('finance_appraisal_deadline') || null,
      settlement_deadline: formData.get('settlement_deadline'),
      custom_deadline_1_label: formData.get('custom_deadline_1_label') || null,
      custom_deadline_1_date: formData.get('custom_deadline_1_date') || null,
      custom_deadline_2_label: formData.get('custom_deadline_2_label') || null,
      custom_deadline_2_date: formData.get('custom_deadline_2_date') || null,
    }

    const { error } = await supabase
      .from('transactions')
      .update(data)
      .eq('id', transaction.id)

    if (error) {
      alert('Error updating transaction: ' + error.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/transactions/${transaction.id}`)
  }

  const inputClass = 'w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600'
  const labelClass = 'block text-sm font-medium text-slate-300 mb-2'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Transaction Type</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Transaction</label>
            <select name="transaction_type" className={inputClass} required defaultValue={transaction.transaction_type}>
              <option value="purchase">Purchase</option>
              <option value="lease">Lease</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Your Role</label>
            <select 
              name="transaction_type" 
              id="transaction_type"
              className={inputClass} 
              required 
              defaultValue={transaction.transaction_type}
              onChange={(e) => {
                setShowLimitedAgency(e.target.value === 'limited_agency')
                setAgencyRole(e.target.value)
              }}
            >
              <option value="listing">Listing Agent (Representing Seller)</option>
              <option value="buyer_agency">Buyer's Agent (Representing Buyer)</option>
              <option value="limited_agency">Limited Agency - Buyer/Seller</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Agent</label>
            <select 
              name="agent_id" 
              className={inputClass}
              required 
              defaultValue={transaction.agent_id}
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
              <p className="text-xs text-slate-500 mt-1">Agents cannot reassign transactions</p>
            )}
          </div>
        </div>

        {/* Limited Agency Disclosure - Only shows when Limited Agency is selected */}
        {showLimitedAgency && (
          <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="limited_agency_disclosure_received"
                className="mt-1"
                defaultChecked={transaction.limited_agency_disclosure_received}
              />
              <div>
                <span className="text-sm font-medium text-orange-400">Limited Agency Disclosure and Agreement Received</span>
                <p className="text-xs text-orange-300/70 mt-1">Disclosure must be signed and dated no later than the offer reference date</p>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Property</h2>
        
        <div>
          <label className={labelClass}>Address</label>
          <input
            type="text"
            name="property_address"
            className={inputClass}
            required
            defaultValue={transaction.property_address}
          />
        </div>

        <div>
          <label className={labelClass}>County</label>
          <select
            name="county"
            className={inputClass}
            defaultValue={transaction.county || ''}
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
          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              name="property_city"
              className={inputClass}
              required
              defaultValue={transaction.property_city}
            />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input
              type="text"
              name="property_state"
              className={inputClass}
              defaultValue={transaction.property_state || 'UT'}
            />
          </div>
          <div>
            <label className={labelClass}>ZIP</label>
            <input
              type="text"
              name="property_zip"
              className={inputClass}
              defaultValue={transaction.property_zip}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Property Type</label>
          <select name="property_type" className={inputClass} required defaultValue={transaction.property_type}>
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

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Buyer</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>First Name</label>
            <input
              type="text"
              name="buyer_first_name"
              className={inputClass}
              required
              defaultValue={transaction.buyer_first_name}
            />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input
              type="text"
              name="buyer_last_name"
              className={inputClass}
              required
              defaultValue={transaction.buyer_last_name}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              name="buyer_email"
              className={inputClass}
              defaultValue={transaction.buyer_email || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              name="buyer_phone"
              className={inputClass}
              defaultValue={transaction.buyer_phone || ''}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Seller</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>First Name</label>
            <input
              type="text"
              name="seller_first_name"
              className={inputClass}
              defaultValue={transaction.seller_first_name || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input
              type="text"
              name="seller_last_name"
              className={inputClass}
              defaultValue={transaction.seller_last_name || ''}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              name="seller_email"
              className={inputClass}
              defaultValue={transaction.seller_email || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              name="seller_phone"
              className={inputClass}
              defaultValue={transaction.seller_phone || ''}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
          {agencyRole === 'listing_agent' ? "Buyer's Agent (Cooperating Broker)" : 
           agencyRole === 'buyer_agent' ? "Listing Agent (Cooperating Broker)" :
           "Other Agent (Cooperating Broker)"}
        </h2>
        
        <div>
          <label className={labelClass}>Brokerage Name</label>
          <input
            type="text"
            name="cooperating_brokerage"
            className={inputClass}
            placeholder="e.g., Keller Williams Realty"
            defaultValue={transaction.cooperating_brokerage || ''}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Agent Name</label>
            <input
              type="text"
              name="cooperating_agent_name"
              className={inputClass}
              placeholder="e.g., John Smith"
              defaultValue={transaction.cooperating_agent_name || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Agent Phone</label>
            <input
              type="tel"
              name="cooperating_agent_phone"
              className={inputClass}
              placeholder="(801) 555-1234"
              defaultValue={transaction.cooperating_agent_phone || ''}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Agent Email</label>
          <input
            type="email"
            name="cooperating_agent_email"
            className={inputClass}
            placeholder="agent@example.com"
            defaultValue={transaction.cooperating_agent_email || ''}
          />
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">REPC Summary</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Offer Reference Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="offer_reference_date"
              className={inputClass}
              required
              defaultValue={transaction.offer_reference_date || ''}
            />
            <p className="text-xs text-slate-500 mt-1">REPC front page - before acceptance</p>
          </div>
          <div>
            <label className={labelClass}>
              Contract Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="contract_date"
              className={inputClass}
              required
              defaultValue={transaction.contract_date || ''}
            />
            <p className="text-xs text-slate-500 mt-1">Date accepted/signed by all parties</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Purchase Price</label>
            <input
              type="number"
              name="purchase_price"
              step="0.01"
              className={inputClass}
              placeholder="$"
              defaultValue={transaction.purchase_price || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Earnest Money Amount</label>
            <input
              type="number"
              name="earnest_money_amount"
              step="0.01"
              className={inputClass}
              placeholder="$"
              defaultValue={transaction.earnest_money_amount || ''}
            />
            <p className="text-xs text-slate-500 mt-1">Due within 4 days of contract date</p>
          </div>
        </div>

        <div>
          <label className={labelClass}>Where is the Earnest Money?</label>
          <select 
            name="earnest_money_location" 
            className={inputClass}
            value={earnestMoneyLocation}
            onChange={(e) => setEarnestMoneyLocation(e.target.value)}
          >
            <option value="">Select location...</option>
            <option value="buyer_title_company">Buyer Title Company</option>
            <option value="seller_title_company">Seller Title Company</option>
            <option value="buyer_broker">Buyer's Broker</option>
            <option value="listing_broker">Listing Broker</option>
            <option value="other">Other</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Where the earnest money deposit is being held</p>
        </div>

        {earnestMoneyLocation === 'other' && (
          <div>
            <label className={labelClass}>Please Specify Location</label>
            <input
              type="text"
              name="earnest_money_location_other"
              className={inputClass}
              placeholder="Specify where earnest money is held"
              defaultValue={transaction.earnest_money_location_other || ''}
            />
          </div>
        )}

        <h3 className="text-sm font-semibold text-slate-300 mt-6 mb-3">Seller's Title Company</h3>
        
        <div>
          <label className={labelClass}>Company Name</label>
          <input
            type="text"
            name="seller_title_company"
            className={inputClass}
            placeholder="e.g., Fidelity National Title"
            defaultValue={transaction.seller_title_company || ''}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Contact Person</label>
            <input
              type="text"
              name="seller_title_contact_name"
              className={inputClass}
              placeholder="Contact name"
              defaultValue={transaction.seller_title_contact_name || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Contact Email</label>
            <input
              type="email"
              name="seller_title_contact_email"
              className={inputClass}
              placeholder="email@company.com"
              defaultValue={transaction.seller_title_contact_email || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Contact Phone</label>
            <input
              type="tel"
              name="seller_title_contact_phone"
              className={inputClass}
              placeholder="(801) 555-1234"
              defaultValue={transaction.seller_title_contact_phone || ''}
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-300 mt-6 mb-3">Buyer's Title Company</h3>
        
        <div>
          <label className={labelClass}>Company Name</label>
          <input
            type="text"
            name="buyer_title_company"
            className={inputClass}
            placeholder="e.g., First American Title"
            defaultValue={transaction.buyer_title_company || ''}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Contact Person</label>
            <input
              type="text"
              name="buyer_title_contact_name"
              className={inputClass}
              placeholder="Contact name"
              defaultValue={transaction.buyer_title_contact_name || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Contact Email</label>
            <input
              type="email"
              name="buyer_title_contact_email"
              className={inputClass}
              placeholder="email@company.com"
              defaultValue={transaction.buyer_title_contact_email || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Contact Phone</label>
            <input
              type="tel"
              name="buyer_title_contact_phone"
              className={inputClass}
              placeholder="(801) 555-1234"
              defaultValue={transaction.buyer_title_contact_phone || ''}
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-300 mt-6 mb-3">Section 24 Deadlines</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Seller Disclosure Deadline</label>
            <input
              type="date"
              name="seller_disclosure_deadline"
              className={inputClass}
              defaultValue={transaction.seller_disclosure_deadline || ''}
            />
            <p className="text-xs text-slate-500 mt-1">Section 24(a)</p>
          </div>
          <div>
            <label className={labelClass}>Due Diligence Deadline</label>
            <input
              type="date"
              name="due_diligence_deadline"
              className={inputClass}
              defaultValue={transaction.due_diligence_deadline || ''}
            />
            <p className="text-xs text-slate-500 mt-1">Section 24(b)</p>
          </div>
          <div>
            <label className={labelClass}>Finance & Appraisal Deadline</label>
            <input
              type="date"
              name="finance_appraisal_deadline"
              className={inputClass}
              defaultValue={transaction.finance_appraisal_deadline || ''}
            />
            <p className="text-xs text-slate-500 mt-1">Section 24(c)</p>
          </div>
          <div>
            <label className={labelClass}>
              Settlement Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="settlement_deadline"
              className={inputClass}
              required
              defaultValue={transaction.settlement_deadline || ''}
            />
            <p className="text-xs text-slate-500 mt-1">Section 24(d)</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-300 mt-6 mb-3">Additional Deadlines (Optional)</h3>
        <p className="text-xs text-slate-500 mb-3">For contingencies in addendums or special conditions</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Deadline Name</label>
            <input
              type="text"
              name="custom_deadline_1_label"
              className={inputClass}
              placeholder="e.g., HOA Approval, Septic Inspection"
              defaultValue={transaction.custom_deadline_1_label || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              name="custom_deadline_1_date"
              className={inputClass}
              defaultValue={transaction.custom_deadline_1_date || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Deadline Name</label>
            <input
              type="text"
              name="custom_deadline_2_label"
              className={inputClass}
              placeholder="e.g., Well Test, Zoning Approval"
              defaultValue={transaction.custom_deadline_2_label || ''}
            />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              name="custom_deadline_2_date"
              className={inputClass}
              defaultValue={transaction.custom_deadline_2_date || ''}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

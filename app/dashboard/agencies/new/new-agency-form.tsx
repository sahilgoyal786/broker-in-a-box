'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { initializeAgencyCompliance } from '@/lib/compliance/initialize-agency-compliance'

export default function NewAgencyForm({ brokerId, agents, currentAgentId, isAgent, agreementType: initialType }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [agreementType, setAgreementType] = useState(initialType || 'listing_agreement')
  const [selectedAgentId, setSelectedAgentId] = useState(currentAgentId || '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const data: any = {
      broker_id: brokerId,
      agent_id: formData.get('agent_id'),
      agreement_type: formData.get('agreement_type'),
      client_first_name: formData.get('client_first_name'),
      client_last_name: formData.get('client_last_name'),
      client_email: formData.get('client_email'),
      client_phone: formData.get('client_phone'),
      agreement_date: formData.get('agreement_date'),
      expiration_date: formData.get('expiration_date') || null,
      status: 'active'
    }

    // Only include property info for listing agreements
    if (agreementType === 'listing_agreement') {
      data.property_address = formData.get('property_address')
      data.county = formData.get('county') || null
      data.property_city = formData.get('property_city')
      data.property_state = formData.get('property_state')
      data.property_zip = formData.get('property_zip')
      data.property_type = formData.get('property_type')
      data.list_price = formData.get('list_price') || null
      data.tax_id = formData.get('tax_id') || null
      data.mls_number = formData.get('mls_number') || null
    }

    const { data: agency, error } = await supabase
      .from('agency_agreements')
      .insert(data)
      .select()
      .single() as any

    if (error) {
      alert('Error creating agency agreement: ' + error.message)
      setLoading(false)
      return
    }

    // Initialize compliance checklist
    const propertyType = data.property_type || 'residential'
    await initializeAgencyCompliance(
      supabase,
      agency.id,
      agreementType as 'listing_agreement' | 'buyer_agency_agreement',
      propertyType
    )

    // If listing agreement, also create the basic listing record
    if (agreementType === 'listing_agreement') {
      const listingData: any = {
        broker_id: brokerId,
        agent_id: formData.get('agent_id'),
        agency_agreement_id: agency.id,
        property_address: formData.get('property_address'),
        property_city: formData.get('property_city'),
        property_state: formData.get('property_state'),
        property_zip: formData.get('property_zip'),
        property_type: formData.get('property_type'),
        tax_id: formData.get('tax_id') || null,
        mls_number: formData.get('mls_number') || null,
        listing_price: formData.get('list_price'),
        listing_start_date: formData.get('agreement_date'),
        listing_end_date: formData.get('expiration_date') || null,
        seller_name: `${formData.get('client_first_name')} ${formData.get('client_last_name')}`,
        seller_email: formData.get('client_email') || null,
        seller_phone: formData.get('client_phone') || null,
        status: 'active'
      }

      const { error: listingError } = await supabase
        .from('listings')
        .insert(listingData)

      if (listingError) {
        console.error('Error creating listing:', listingError)
        // Don't fail the whole operation, just log it
      }
    }

    router.push(`/dashboard/agencies/${agency.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Agreement Type</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <select
            name="agreement_type"
            value={agreementType}
            onChange={(e) => setAgreementType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="listing_agreement">Listing Agreement</option>
            <option value="buyer_agency_agreement">Buyer Agency Agreement</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Agent</label>
          <select 
            name="agent_id" 
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" 
            required
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
            <p className="text-xs text-slate-500 mt-1">This agreement will be assigned to you</p>
          )}
        </div>

        {agreementType === 'listing_agreement' && (
          <div>
            <label className="block text-sm font-medium mb-2">Property Type</label>
            <select 
              name="property_type" 
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="residential">Residential</option>
              <option value="vacant_land">Vacant Land</option>
              <option value="mobile_home">Mobile Home</option>
              <option value="commercial">Commercial</option>
              <option value="multi_unit">Multi-Unit</option>
              <option value="farm">Farm</option>
              <option value="residential_lease">Residential Lease</option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Client Information</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              name="client_first_name"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              name="client_last_name"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="client_email"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="client_phone"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {agreementType === 'listing_agreement' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Property Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Property Address</label>
            <input
              type="text"
              name="property_address"
              className="w-full px-3 py-2 border rounded-lg"
              required={agreementType === 'listing_agreement'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tax ID Number</label>
            <input
              type="text"
              name="tax_id"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Required if no street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">County</label>
            <select name="county" className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select county...</option>
              <option value="Salt Lake County">Salt Lake County</option>
              <option value="Utah County">Utah County</option>
              <option value="Davis County">Davis County</option>
              <option value="Weber County">Weber County</option>
              <option value="Washington County">Washington County</option>
              <option value="Summit County">Summit County</option>
              <option value="Cache County">Cache County</option>
              <option value="Tooele County">Tooele County</option>
              <option value="Box Elder County">Box Elder County</option>
              <option value="Iron County">Iron County</option>
              <option value="Wasatch County">Wasatch County</option>
              <option value="Carbon County">Carbon County</option>
              <option value="Sanpete County">Sanpete County</option>
              <option value="Sevier County">Sevier County</option>
              <option value="Uintah County">Uintah County</option>
              <option value="Duchesne County">Duchesne County</option>
              <option value="Juab County">Juab County</option>
              <option value="Millard County">Millard County</option>
              <option value="Morgan County">Morgan County</option>
              <option value="Grand County">Grand County</option>
              <option value="Emery County">Emery County</option>
              <option value="San Juan County">San Juan County</option>
              <option value="Rich County">Rich County</option>
              <option value="Beaver County">Beaver County</option>
              <option value="Wayne County">Wayne County</option>
              <option value="Piute County">Piute County</option>
              <option value="Garfield County">Garfield County</option>
              <option value="Kane County">Kane County</option>
              <option value="Daggett County">Daggett County</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                name="property_city"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <input
                type="text"
                name="property_state"
                defaultValue="UT"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">ZIP</label>
              <input
                type="text"
                name="property_zip"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">MLS Number</label>
              <input
                type="text"
                name="mls_number"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">List Price</label>
            <input
              type="number"
              name="list_price"
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Dates</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Agreement Date</label>
            <input
              type="date"
              name="agreement_date"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expiration Date</label>
            <input
              type="date"
              name="expiration_date"
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
          {loading ? 'Creating...' : 'Create Agency Agreement'}
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

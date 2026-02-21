'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Agent = {
  id: string
  first_name: string
  last_name: string
  email: string
}

type Agency = {
  id: string
  client_first_name: string
  client_last_name: string
  client_email?: string
  client_phone?: string
  property_address?: string
  property_city?: string
  property_state?: string
  property_zip?: string
  property_type?: string
  list_price?: number
  agent: {
    id: string
    first_name: string
    last_name: string
  }
}

type Props = {
  role: string
  agents: Agent[]
  currentAgentId?: string
  agencyAgreement?: Agency | null
}

export default function NewListingForm({ role, agents, currentAgentId, agencyAgreement }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    // Get broker ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!broker) {
      setError('Broker not found')
      setLoading(false)
      return
    }

    const agentId = agencyAgreement 
      ? agencyAgreement.agent.id 
      : (role === 'agent' ? currentAgentId : formData.get('agent_id'))

    const { error: insertError } = await supabase
      .from('listings')
      .insert({
        broker_id: broker.id,
        agent_id: agentId,
        agency_agreement_id: agencyAgreement?.id || null,
        property_address: formData.get('property_address'),
        property_city: formData.get('property_city'),
        property_state: formData.get('property_state'),
        property_zip: formData.get('property_zip'),
        property_type: formData.get('property_type'),
        listing_price: formData.get('listing_price'),
        mls_number: formData.get('mls_number') || null,
        listing_start_date: formData.get('listing_start_date'),
        listing_end_date: formData.get('listing_end_date'),
        commission_percentage: formData.get('commission_percentage') || null,
        buyer_agent_commission_percentage: formData.get('buyer_agent_commission_percentage') || null,
        seller_name: formData.get('seller_name'),
        seller_email: formData.get('seller_email') || null,
        seller_phone: formData.get('seller_phone') || null,
        bedrooms: formData.get('bedrooms') || null,
        bathrooms: formData.get('bathrooms') || null,
        square_feet: formData.get('square_feet') || null,
        lot_size: formData.get('lot_size') || null,
        year_built: formData.get('year_built') || null,
        notes: formData.get('notes') || null,
        status: 'active'
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // If linked to agency, go back to agency detail page
    if (agencyAgreement) {
      router.push(`/dashboard/agencies/${agencyAgreement.id}`)
    } else {
      router.push('/dashboard/listings')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-4xl">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Agent Selection (Broker only) - Hidden if agency provided */}
        {role === 'broker' && !agencyAgreement && (
          <div className="col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Agent *
            </label>
            <select
              name="agent_id"
              required
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">Select agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.first_name} {agent.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Property Address */}
        <div className="col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Property Address *
          </label>
          <input
            type="text"
            name="property_address"
            required
            defaultValue={agencyAgreement?.property_address || ''}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            placeholder="123 Main St"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            City *
          </label>
          <input
            type="text"
            name="property_city"
            required
            defaultValue={agencyAgreement?.property_city || ''}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            State *
          </label>
          <input
            type="text"
            name="property_state"
            defaultValue={agencyAgreement?.property_state || 'UT'}
            required
            maxLength={2}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            ZIP Code *
          </label>
          <input
            type="text"
            name="property_zip"
            required
            defaultValue={agencyAgreement?.property_zip || ''}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Property Type *
          </label>
          <select
            name="property_type"
            required
            defaultValue={agencyAgreement?.property_type || ''}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          >
            <option value="">Select type...</option>
            <option value="residential">Residential</option>
            <option value="vacant_land">Vacant Land</option>
            <option value="mobile_home">Mobile Home</option>
            <option value="commercial">Commercial</option>
            <option value="multi_unit">Multi-Unit</option>
            <option value="farm">Farm</option>
          </select>
        </div>

        {/* Listing Price */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Listing Price *
          </label>
          <input
            type="number"
            name="listing_price"
            required
            step="0.01"
            defaultValue={agencyAgreement?.list_price || ''}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            placeholder="500000"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            MLS Number (if published)
          </label>
          <input
            type="text"
            name="mls_number"
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        {/* Listing Period */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Listing Start Date *
          </label>
          <input
            type="date"
            name="listing_start_date"
            required
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Listing End Date *
          </label>
          <input
            type="date"
            name="listing_end_date"
            required
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        {/* Commission */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Total Commission %
          </label>
          <input
            type="number"
            name="commission_percentage"
            step="0.01"
            min="0"
            max="100"
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            placeholder="6.00"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Buyer Agent Commission %
          </label>
          <input
            type="number"
            name="buyer_agent_commission_percentage"
            step="0.01"
            min="0"
            max="100"
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            placeholder="3.00"
          />
        </div>

        {/* Seller Information */}
        <div className="col-span-2">
          <h3 className="text-lg font-bold mb-4 mt-6">Seller Information</h3>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Seller Name *
          </label>
          <input
            type="text"
            name="seller_name"
            required
            defaultValue={agencyAgreement ? `${agencyAgreement.client_first_name} ${agencyAgreement.client_last_name}` : ''}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Seller Email
          </label>
          <input
            type="email"
            name="seller_email"
            defaultValue={agencyAgreement?.client_email || ''}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Seller Phone
          </label>
          <input
            type="tel"
            name="seller_phone"
            defaultValue={agencyAgreement?.client_phone || ''}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        {/* Property Details */}
        <div className="col-span-2">
          <h3 className="text-lg font-bold mb-4 mt-6">Property Details (Optional)</h3>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Bedrooms
          </label>
          <input
            type="number"
            name="bedrooms"
            min="0"
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Bathrooms
          </label>
          <input
            type="number"
            name="bathrooms"
            step="0.5"
            min="0"
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Square Feet
          </label>
          <input
            type="number"
            name="square_feet"
            min="0"
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Lot Size
          </label>
          <input
            type="text"
            name="lot_size"
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            placeholder="0.25 acres"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Year Built
          </label>
          <input
            type="number"
            name="year_built"
            min="1800"
            max={new Date().getFullYear()}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            rows={4}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            placeholder="Any additional notes about this listing..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Listing'}
        </button>
      </div>
    </form>
  )
}

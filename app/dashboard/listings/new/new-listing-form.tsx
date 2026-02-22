'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { addLeadPaintDisclosure } from '@/lib/compliance/initialize-agency-compliance'

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
  agreement_date?: string
  expiration_date?: string
  tax_id?: string
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
  const [propertyType, setPropertyType] = useState(agencyAgreement?.property_type || 'residential')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    // Get broker ID based on role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let brokerId: string | null = null

    if (role === 'broker') {
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (!broker) {
        setError('Broker not found')
        setLoading(false)
        return
      }
      brokerId = broker.id
    } else {
      // Agent: get broker_id from agents table
      const { data: agent } = await supabase
        .from('agents')
        .select('broker_id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (!agent) {
        setError('Agent not found')
        setLoading(false)
        return
      }
      brokerId = agent.broker_id
    }

    const agentId = agencyAgreement 
      ? agencyAgreement.agent.id 
      : (role === 'agent' ? currentAgentId : formData.get('agent_id'))

    const { error: insertError} = await supabase
      .from('listings')
      .insert({
        broker_id: brokerId,
        agent_id: agentId,
        agency_agreement_id: agencyAgreement?.id || null,
        property_address: formData.get('property_address'),
        property_city: formData.get('property_city'),
        property_state: formData.get('property_state'),
        property_zip: formData.get('property_zip'),
        county: formData.get('county') || null,
        tax_id: formData.get('tax_id') || null,
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
        lot_size_land: formData.get('lot_size_land') || null,
        zoning: formData.get('zoning') || null,
        number_of_units: formData.get('number_of_units') || null,
        total_bedrooms: formData.get('total_bedrooms') || null,
        total_bathrooms: formData.get('total_bathrooms') || null,
        commercial_use: formData.get('commercial_use') || null,
        notes: formData.get('notes') || null,
        status: 'active'
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Check if need to add lead paint disclosure for pre-1978 properties
    const yearBuilt = formData.get('year_built')
    const propertyType = formData.get('property_type') as string
    if (agencyAgreement && yearBuilt) {
      const year = parseInt(yearBuilt as string)
      if (year && year < 1978) {
        await addLeadPaintDisclosure(supabase, agencyAgreement.id, year, propertyType || 'residential')
      }
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

        {/* Property Type - At Top */}
        <div className="col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Property Type *
          </label>
          <select
            name="property_type"
            required
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          >
            <option value="">Select type...</option>
            <option value="residential">Residential</option>
            <option value="vacant_land">Vacant Land</option>
            <option value="commercial">Commercial</option>
            <option value="multi_unit">Multi-Unit</option>
            <option value="farm">Farm</option>
            <option value="residential_lease">Residential Lease</option>
          </select>
        </div>

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

        {/* County - All Property Types */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            County *
          </label>
          <select
            name="county"
            required
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
          >
            <option value="">Select county...</option>
            <option value="Beaver County">Beaver County</option>
            <option value="Box Elder County">Box Elder County</option>
            <option value="Cache County">Cache County</option>
            <option value="Carbon County">Carbon County</option>
            <option value="Daggett County">Daggett County</option>
            <option value="Davis County">Davis County</option>
            <option value="Duchesne County">Duchesne County</option>
            <option value="Emery County">Emery County</option>
            <option value="Garfield County">Garfield County</option>
            <option value="Grand County">Grand County</option>
            <option value="Iron County">Iron County</option>
            <option value="Juab County">Juab County</option>
            <option value="Kane County">Kane County</option>
            <option value="Millard County">Millard County</option>
            <option value="Morgan County">Morgan County</option>
            <option value="Piute County">Piute County</option>
            <option value="Rich County">Rich County</option>
            <option value="Salt Lake County">Salt Lake County</option>
            <option value="San Juan County">San Juan County</option>
            <option value="Sanpete County">Sanpete County</option>
            <option value="Sevier County">Sevier County</option>
            <option value="Summit County">Summit County</option>
            <option value="Tooele County">Tooele County</option>
            <option value="Uintah County">Uintah County</option>
            <option value="Utah County">Utah County</option>
            <option value="Wasatch County">Wasatch County</option>
            <option value="Washington County">Washington County</option>
            <option value="Wayne County">Wayne County</option>
            <option value="Weber County">Weber County</option>
          </select>
        </div>

        {/* Tax ID - All Property Types */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tax ID Number
          </label>
          <input
            type="text"
            name="tax_id"
            defaultValue={agencyAgreement?.tax_id || ''}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            placeholder="Required if no street address"
          />
        </div>

        {/* Property Details Header */}
        <div className="col-span-2">
          <h3 className="text-lg font-bold mb-4 mt-6">Property Details</h3>
        </div>

        {/* RESIDENTIAL */}
        {propertyType === 'residential' && (
          <>
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
          </>
        )}

        {/* VACANT LAND */}
        {propertyType === 'vacant_land' && (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Lot Size
              </label>
              <input
                type="text"
                name="lot_size_land"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="2.5 acres or 10,890 sq ft"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Zoning
              </label>
              <select
                name="zoning"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
              >
                <option value="">Select zoning...</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Multi-Family">Multi-Family</option>
                <option value="Short Term Rental Allowed">Short Term Rental Allowed</option>
                <option value="Single-Family">Single-Family</option>
                <option value="See Remarks">See Remarks</option>
              </select>
            </div>
          </>
        )}

        {/* MULTI-UNIT */}
        {propertyType === 'multi_unit' && (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Number of Units
              </label>
              <input
                type="number"
                name="number_of_units"
                min="2"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="e.g., 4"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Total Bedrooms
              </label>
              <input
                type="number"
                name="total_bedrooms"
                min="0"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="Across all units"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Total Bathrooms
              </label>
              <input
                type="number"
                name="total_bathrooms"
                step="0.5"
                min="0"
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
                placeholder="Across all units"
              />
            </div>
          </>
        )}

        {/* COMMERCIAL */}
        {propertyType === 'commercial' && (
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Commercial Use
            </label>
            <select
              name="commercial_use"
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">Select use...</option>
              <option value="Office">Office</option>
              <option value="Retail">Retail</option>
              <option value="Industrial">Industrial</option>
              <option value="Flex">Flex</option>
              <option value="Medical">Medical</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}

        {/* FARM - Basic shell only (too rare for Wasatch Front) */}
        {propertyType === 'farm' && (
          <div className="col-span-2">
            <p className="text-gray-600 italic">
              Farm properties use basic information only (address, county, tax ID).
            </p>
          </div>
        )}

        {/* RESIDENTIAL LEASE - Basic shell only (too rare for Wasatch Front) */}
        {propertyType === 'residential_lease' && (
          <div className="col-span-2">
            <p className="text-gray-600 italic">
              Residential lease properties use basic information only (address, county, tax ID).
            </p>
          </div>
        )}

        {/* Listing Information Header */}
        <div className="col-span-2">
          <h3 className="text-lg font-bold mb-4 mt-6">Listing Information</h3>
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
            defaultValue={agencyAgreement?.agreement_date ? agencyAgreement.agreement_date.split('T')[0] : ''}
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
            defaultValue={agencyAgreement?.expiration_date ? agencyAgreement.expiration_date.split('T')[0] : ''}
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
          {loading 
            ? (agencyAgreement ? 'Saving...' : 'Creating...') 
            : (agencyAgreement ? 'Save Property Details' : 'Create Listing')
          }
        </button>
      </div>
    </form>
  )
}

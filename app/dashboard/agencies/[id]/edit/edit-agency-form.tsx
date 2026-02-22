'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditAgencyForm({ agency, listing, agents }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    // Update agency agreement
    const agencyData: any = {
      client_first_name: formData.get('client_first_name'),
      client_last_name: formData.get('client_last_name'),
      client_email: formData.get('client_email') || null,
      client_phone: formData.get('client_phone') || null,
      agreement_date: formData.get('agreement_date'),
      expiration_date: formData.get('expiration_date') || null,
    }

    if (agency.agreement_type === 'listing_agreement') {
      agencyData.property_address = formData.get('property_address')
      agencyData.county = formData.get('county') || null
      agencyData.property_city = formData.get('property_city')
      agencyData.property_state = formData.get('property_state')
      agencyData.property_zip = formData.get('property_zip')
      agencyData.property_type = formData.get('property_type')
      agencyData.list_price = formData.get('list_price') || null
      agencyData.mls_number = formData.get('mls_number') || null
      agencyData.tax_id = formData.get('tax_id') || null
    }

    const { error: agencyError } = await supabase
      .from('agency_agreements')
      .update(agencyData)
      .eq('id', agency.id)

    if (agencyError) {
      setError(agencyError.message)
      setLoading(false)
      return
    }

    // Update listing if exists
    if (listing && agency.agreement_type === 'listing_agreement') {
      const listingData: any = {
        property_address: formData.get('property_address'),
        property_city: formData.get('property_city'),
        property_state: formData.get('property_state'),
        property_zip: formData.get('property_zip'),
        county: formData.get('county') || null,
        property_type: formData.get('property_type'),
        tax_id: formData.get('tax_id') || null,
        mls_number: formData.get('mls_number') || null,
        listing_price: formData.get('list_price'),
        listing_start_date: formData.get('agreement_date'),
        listing_end_date: formData.get('expiration_date') || null,
        seller_name: `${formData.get('client_first_name')} ${formData.get('client_last_name')}`,
        seller_email: formData.get('client_email') || null,
        seller_phone: formData.get('client_phone') || null,
      }

      const { error: listingError } = await supabase
        .from('listings')
        .update(listingData)
        .eq('id', listing.id)

      if (listingError) {
        console.error('Error updating listing:', listingError)
      }
    }

    router.push(`/dashboard/agencies/${agency.id}`)
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
        <h2 className="text-lg font-semibold border-b pb-2">Client Information</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              name="client_first_name"
              defaultValue={agency.client_first_name}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              name="client_last_name"
              defaultValue={agency.client_last_name}
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
              name="client_email"
              defaultValue={agency.client_email || ''}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="client_phone"
              defaultValue={agency.client_phone || ''}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {agency.agreement_type === 'listing_agreement' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Property Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Property Type</label>
            <select 
              name="property_type" 
              defaultValue={agency.property_type || 'residential'}
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

          <div>
            <label className="block text-sm font-medium mb-2">Property Address</label>
            <input
              type="text"
              name="property_address"
              defaultValue={agency.property_address || ''}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tax ID Number</label>
            <input
              type="text"
              name="tax_id"
              defaultValue={agency.tax_id || listing?.tax_id || ''}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Required if no street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">County</label>
            <select 
              name="county" 
              defaultValue={agency.county || listing?.county || ''}
              className="w-full px-3 py-2 border rounded-lg"
            >
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
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                name="property_city"
                defaultValue={agency.property_city || ''}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <input
                type="text"
                name="property_state"
                defaultValue={agency.property_state || 'UT'}
                maxLength={2}
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
                defaultValue={agency.property_zip || ''}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">MLS Number</label>
              <input
                type="text"
                name="mls_number"
                defaultValue={agency.mls_number || listing?.mls_number || ''}
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
              defaultValue={agency.list_price || ''}
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
              defaultValue={agency.agreement_date?.split('T')[0]}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expiration Date</label>
            <input
              type="date"
              name="expiration_date"
              defaultValue={agency.expiration_date?.split('T')[0] || ''}
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
          {loading ? 'Saving...' : 'Save Changes'}
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

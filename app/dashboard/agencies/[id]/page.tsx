import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, FileText, Home, ArrowLeft } from 'lucide-react'
import ComplianceChecklist from './compliance-checklist'

export default async function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single() as any

  if (!broker) redirect('/auth/login')

  // Get agency agreement
  const { data: agency } = await supabase
    .from('agency_agreements')
    .select(`
      *,
      agent:agents(first_name, last_name, email)
    `)
    .eq('id', id)
    .eq('broker_id', broker.id)
    .single() as any

  if (!agency) redirect('/dashboard/agencies')

  // Get related transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('agency_agreement_id', id)
    .order('created_at', { ascending: false }) as any

  // Get listing details if this is a listing agreement
  let listing = null
  if (agency.agreement_type === 'listing_agreement') {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('agency_agreement_id', id)
      .maybeSingle() as any
    listing = data
  }

  // Get compliance checklist items
  const { data: complianceItems } = await supabase
    .from('agency_compliance_items')
    .select('*')
    .eq('agency_agreement_id', id)
    .order('is_required', { ascending: false })
    .order('form_name') as any

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/agencies"
        className="inline-flex items-center text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Agency Agreements
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            {agency.agreement_type === 'listing_agreement' ? 'Listing Agreement' : 'Buyer Agency Agreement'}
          </h1>
          <p className="text-gray-600 mt-1">
            {agency.client_first_name} {agency.client_last_name}
          </p>
        </div>
        <Link
          href={`/dashboard/transactions/new?agency=${id}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase Contract
        </Link>
      </div>

      {/* Agency Details */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Agreement Details</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Type</label>
            <p className="font-medium">
              {agency.agreement_type === 'listing_agreement' ? 'Listing Agreement' : 'Buyer Agency Agreement'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <p>
              <span className={`px-2 py-1 text-xs rounded-full ${
                agency.status === 'active' ? 'bg-green-100 text-green-800' :
                agency.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {agency.status}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Client Name</label>
            <p className="font-medium">{agency.client_first_name} {agency.client_last_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Agent</label>
            <p className="font-medium">{agency.agent?.first_name} {agency.agent?.last_name}</p>
          </div>
        </div>

        {agency.client_email && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p>{agency.client_email}</p>
            </div>
            {agency.client_phone && (
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p>{agency.client_phone}</p>
              </div>
            )}
          </div>
        )}

        {agency.property_address && (
          <div>
            <label className="text-sm text-gray-600">Property</label>
            <p className="font-medium">{agency.property_address}</p>
            <p className="text-sm">
              {agency.property_city && `${agency.property_city}, `}
              {agency.property_state || 'UT'} {agency.property_zip}
            </p>
            {agency.property_type && (
              <p className="text-sm text-gray-600 mt-1">
                {agency.property_type.replace(/_/g, ' ')}
              </p>
            )}
            {agency.list_price && (
              <p className="text-sm text-gray-600">
                List Price: ${agency.list_price.toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Agreement Date</label>
            <p>{new Date(agency.agreement_date).toLocaleDateString()}</p>
          </div>
          {agency.expiration_date && (
            <div>
              <label className="text-sm text-gray-600">Expiration Date</label>
              <p>{new Date(agency.expiration_date).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Property Details (Listing Agreements Only) */}
      {agency.agreement_type === 'listing_agreement' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg font-semibold">Property Details</h2>
            {listing ? (
              <Link
                href={`/dashboard/listings/${listing.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit Details
              </Link>
            ) : (
              <Link
                href={`/dashboard/listings/new?agency=${id}`}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <Home className="w-4 h-4 mr-1" />
                Add Property Details
              </Link>
            )}
          </div>
          
          {listing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Property Address</label>
                <p className="font-medium">{listing.property_address}</p>
                <p className="text-sm text-gray-600">
                  {listing.property_city}, {listing.property_state} {listing.property_zip}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Property Type</label>
                <p className="capitalize">{listing.property_type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Listing Price</label>
                <p className="font-medium text-lg text-green-600">
                  ${listing.listing_price?.toLocaleString()}
                </p>
              </div>
              {listing.mls_number && (
                <div>
                  <label className="text-sm text-gray-600">MLS Number</label>
                  <p className="font-medium">{listing.mls_number}</p>
                </div>
              )}
              {(listing.bedrooms || listing.bathrooms || listing.square_feet) && (
                <>
                  {listing.bedrooms && (
                    <div>
                      <label className="text-sm text-gray-600">Bedrooms</label>
                      <p>{listing.bedrooms}</p>
                    </div>
                  )}
                  {listing.bathrooms && (
                    <div>
                      <label className="text-sm text-gray-600">Bathrooms</label>
                      <p>{listing.bathrooms}</p>
                    </div>
                  )}
                  {listing.square_feet && (
                    <div>
                      <label className="text-sm text-gray-600">Square Feet</label>
                      <p>{listing.square_feet.toLocaleString()} sq ft</p>
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="text-sm text-gray-600">Listing Period</label>
                <p className="text-sm">
                  {new Date(listing.listing_start_date).toLocaleDateString()} - {new Date(listing.listing_end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    listing.status === 'active' ? 'bg-green-100 text-green-800' :
                    listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    listing.status === 'closed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {listing.status}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No property details yet</p>
              <p className="text-sm mt-1">Add MLS info, pricing, and property features</p>
            </div>
          )}
        </div>
      )}

      {/* Compliance Checklist */}
      {complianceItems && complianceItems.length > 0 && (
        <ComplianceChecklist 
          agencyId={id}
          items={complianceItems}
          canEdit={true}
        />
      )}

      {/* Related Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4">Related Purchase Contracts</h2>
        
        {transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((txn: any) => (
              <Link
                key={txn.id}
                href={`/dashboard/transactions/${txn.id}`}
                className="block p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{txn.property_address}</p>
                    <p className="text-sm text-gray-600">
                      {txn.property_city && `${txn.property_city}, `}
                      {txn.property_state || 'UT'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {txn.transaction_type} • {txn.agency_role?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    txn.status === 'under_contract' ? 'bg-blue-100 text-blue-800' :
                    txn.status === 'closed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {txn.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No purchase contracts yet</p>
            <Link
              href={`/dashboard/transactions/new?agency=${id}`}
              className="text-blue-600 hover:underline text-sm mt-2 inline-block"
            >
              Create the first one
            </Link>
          </div>
        )}
      </div>

      {/* Compliance Checklist - Coming Soon */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4">Compliance Checklist</h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Agency agreement compliance tracking coming soon</p>
        </div>
      </div>
    </div>
  )
}

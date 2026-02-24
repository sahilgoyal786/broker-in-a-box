import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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
    .order('sort_order', { ascending: true })
    .order('form_name') as any

  const completedCount = complianceItems?.filter(i => i.is_complete).length || 0
  const totalCount = complianceItems?.filter(i => i.is_required).length || 0

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/agencies"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {agency.agreement_type === 'listing_agreement' ? 'Listing' : 'Buyer Agreement'}
            </h1>
            <p className="text-gray-600">
              {agency.client_first_name} {agency.client_last_name} • {agency.agent?.first_name} {agency.agent?.last_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {agency.status === 'active' && (
            <Link
              href={
                agency.agreement_type === 'listing_agreement' 
                  ? `/dashboard/transactions/new?from_listing=${id}`
                  : `/dashboard/transactions/new?from_buyer=${id}`
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Create Purchase Contract
            </Link>
          )}
          <span className={`px-3 py-1 text-sm rounded-full ${
            agency.status === 'active' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {agency.status}
          </span>
        </div>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="col-span-2 space-y-6">
          {/* Agreement Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Agreement Details</h2>
                {agency.file_id && (
                  <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded font-mono">
                    {agency.file_id}
                  </span>
                )}
              </div>
              <Link
                href={`/dashboard/agencies/${id}/edit`}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <div className="text-gray-600">Client</div>
                <div className="font-medium">{agency.client_first_name} {agency.client_last_name}</div>
                {agency.client_email && <div className="text-gray-600">{agency.client_email}</div>}
                {agency.client_phone && <div className="text-gray-600">{agency.client_phone}</div>}
              </div>
              <div>
                <div className="text-gray-600">Agent</div>
                <div className="font-medium">{agency.agent?.first_name} {agency.agent?.last_name}</div>
                <div className="text-gray-600">{agency.agent?.email}</div>
              </div>
              <div>
                <div className="text-gray-600">Agreement Date</div>
                <div className="font-medium">{new Date(agency.agreement_date).toLocaleDateString()}</div>
              </div>
              {agency.expiration_date && (
                <div>
                  <div className="text-gray-600">Expires</div>
                  <div className="font-medium">{new Date(agency.expiration_date).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Property Details */}
          {listing && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Property Details</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <div className="text-gray-600">Address</div>
                  <div className="font-medium">{listing.property_address}</div>
                  <div className="text-gray-600">
                    {listing.property_city}, {listing.property_state} {listing.property_zip}
                  </div>
                  {listing.county && <div className="text-gray-600">{listing.county}</div>}
                </div>
                <div>
                  <div className="text-gray-600">Property Type</div>
                  <div className="font-medium capitalize">{listing.property_type.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-gray-600">Listing Price</div>
                  <div className="font-medium text-lg text-green-600">
                    ${listing.listing_price?.toLocaleString()}
                  </div>
                </div>
                {listing.mls_number && (
                  <div>
                    <div className="text-gray-600">MLS Number</div>
                    <div className="font-medium">{listing.mls_number}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Compliance */}
        <div className="col-span-1">
          {complianceItems && complianceItems.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Compliance</h2>
                <p className="text-sm text-gray-600">
                  {completedCount} of {totalCount} complete
                </p>
              </div>
              <ComplianceChecklist 
                agencyId={id}
                items={complianceItems}
                canEdit={true}
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              <p>No compliance items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

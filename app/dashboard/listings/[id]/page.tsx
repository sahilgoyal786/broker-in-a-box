import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StatusUpdater from './status-updater'

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')
  const role = userContext.role

  const { id } = await params

  // Fetch listing with agent details
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      agent:agents(first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .single()

  if (!listing) {
    return <div className="p-8">Listing not found</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listing Details</h1>
        <Link
          href="/dashboard/listings"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Listings
        </Link>
      </div>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {/* Property Information */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b">Property Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Address:</span>
              <p>{listing.property_address}</p>
              <p>{listing.property_city}, {listing.property_state} {listing.property_zip}</p>
            </div>
            <div>
              <span className="font-semibold">Property Type:</span>
              <p className="capitalize">{listing.property_type.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="font-semibold">Listing Price:</span>
              <p className="text-xl font-bold text-green-600">
                ${listing.listing_price?.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="font-semibold">MLS Number:</span>
              <p>{listing.mls_number || '—'}</p>
            </div>
            {listing.bedrooms && (
              <div>
                <span className="font-semibold">Bedrooms:</span>
                <p>{listing.bedrooms}</p>
              </div>
            )}
            {listing.bathrooms && (
              <div>
                <span className="font-semibold">Bathrooms:</span>
                <p>{listing.bathrooms}</p>
              </div>
            )}
            {listing.square_feet && (
              <div>
                <span className="font-semibold">Square Feet:</span>
                <p>{listing.square_feet.toLocaleString()} sq ft</p>
              </div>
            )}
            {listing.lot_size && (
              <div>
                <span className="font-semibold">Lot Size:</span>
                <p>{listing.lot_size}</p>
              </div>
            )}
            {listing.year_built && (
              <div>
                <span className="font-semibold">Year Built:</span>
                <p>{listing.year_built}</p>
              </div>
            )}
          </div>
        </div>

        {/* Listing Details */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b">Listing Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Listing Period:</span>
              <p>
                {new Date(listing.listing_start_date).toLocaleDateString()} - {new Date(listing.listing_end_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="font-semibold">Status:</span>
              <StatusUpdater listingId={listing.id} currentStatus={listing.status} />
            </div>
            {listing.commission_percentage && (
              <div>
                <span className="font-semibold">Total Commission:</span>
                <p>{listing.commission_percentage}%</p>
              </div>
            )}
            {listing.buyer_agent_commission_percentage && (
              <div>
                <span className="font-semibold">Buyer Agent Commission:</span>
                <p>{listing.buyer_agent_commission_percentage}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Seller Information */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b">Seller Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Name:</span>
              <p>{listing.seller_name}</p>
            </div>
            {listing.seller_email && (
              <div>
                <span className="font-semibold">Email:</span>
                <p><a href={`mailto:${listing.seller_email}`} className="text-blue-600 hover:underline">{listing.seller_email}</a></p>
              </div>
            )}
            {listing.seller_phone && (
              <div>
                <span className="font-semibold">Phone:</span>
                <p><a href={`tel:${listing.seller_phone}`} className="text-blue-600 hover:underline">{listing.seller_phone}</a></p>
              </div>
            )}
          </div>
        </div>

        {/* Agent Information */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b">Listing Agent</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Agent:</span>
              <p>{listing.agent.first_name} {listing.agent.last_name}</p>
            </div>
            <div>
              <span className="font-semibold">Email:</span>
              <p><a href={`mailto:${listing.agent.email}`} className="text-blue-600 hover:underline">{listing.agent.email}</a></p>
            </div>
            {listing.agent.phone && (
              <div>
                <span className="font-semibold">Phone:</span>
                <p><a href={`tel:${listing.agent.phone}`} className="text-blue-600 hover:underline">{listing.agent.phone}</a></p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {listing.notes && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b">Notes</h2>
            <p className="whitespace-pre-wrap">{listing.notes}</p>
          </div>
        )}

        {/* Documents Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b">Required Documents</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-2">Coming soon: Document tracking for:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Exclusive Right to Sell Listing Agreement</li>
              <li>MLS Data Input Form</li>
              <li>Seller's Property Condition Disclosure</li>
              <li>Wire Fraud Alert Disclosure</li>
              {listing.year_built && listing.year_built < 1978 && (
                <li>Lead-Based Paint Disclosure</li>
              )}
            </ul>
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-sm text-gray-500 pt-4 border-t">
          <p>Created: {new Date(listing.created_at).toLocaleString()}</p>
          <p>Last Updated: {new Date(listing.updated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

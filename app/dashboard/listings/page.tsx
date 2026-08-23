import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Listings',
}

export default async function ListingsPage() {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) redirect('/auth/login')

  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')
  const role = userContext.role

  // Fetch listings based on role
  let query = supabase
    .from('listings')
    .select(`
      *,
      agent:agents(first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  // Agents only see their own
  if (role === 'agent') {
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (agent) {
      query = query.eq('agent_id', agent.id)
    }
  }

  const { data: listings } = await query

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listings</h1>
        <Link
          href="/dashboard/listings/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Listing
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MLS #</th>
              {role === 'broker' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listings?.map((listing) => (
              <tr key={listing.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{listing.property_address}</div>
                  <div className="text-sm text-gray-500">{listing.property_city}, {listing.property_state} {listing.property_zip}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  ${listing.listing_price?.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {listing.mls_number || '—'}
                </td>
                {role === 'broker' && (
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {listing.agent?.first_name} {listing.agent?.last_name}
                  </td>
                )}
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    listing.status === 'active' ? 'bg-green-100 text-green-800' :
                    listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    listing.status === 'closed' ? 'bg-blue-100 text-blue-800' :
                    listing.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {listing.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(listing.listing_end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/dashboard/listings/${listing.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {(!listings || listings.length === 0) && (
              <tr>
                <td colSpan={role === 'broker' ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                  No listings yet. Click "+ New Listing" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

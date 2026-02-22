'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, Users, ChevronUp, ChevronDown } from 'lucide-react'

type Agreement = {
  id: string
  agreement_type: string
  client_first_name: string
  client_last_name: string
  property_address?: string
  property_city?: string
  property_state?: string
  property_zip?: string
  county?: string
  property_type?: string
  list_price?: number
  mls_number?: string
  status: string
  agreement_date: string
  expiration_date?: string
  agent: {
    first_name: string
    last_name: string
  }
}

type Props = {
  listings: Agreement[]
  buyerAgreements: Agreement[]
  role: string
}

export default function AgenciesTabs({ listings, buyerAgreements, role }: Props) {
  const [activeTab, setActiveTab] = useState<'listings' | 'buyers'>('listings')
  const [sortField, setSortField] = useState<string>('agreement_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedAgreements = [...(activeTab === 'listings' ? listings : buyerAgreements)].sort((a, b) => {
    let aVal: any = a[sortField as keyof Agreement]
    let bVal: any = b[sortField as keyof Agreement]

    // Handle nested agent object
    if (sortField === 'agent') {
      aVal = `${a.agent.last_name} ${a.agent.first_name}`
      bVal = `${b.agent.last_name} ${b.agent.first_name}`
    }

    // Handle client name
    if (sortField === 'client') {
      aVal = `${a.client_last_name} ${a.client_first_name}`
      bVal = `${b.client_last_name} ${b.client_first_name}`
    }

    // Handle nulls
    if (aVal == null) return 1
    if (bVal == null) return -1

    // Compare
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />
  }

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('listings')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listings'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Listings
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'listings' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {listings.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('buyers')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'buyers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Buyer Agreements
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'buyers' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {buyerAgreements.length}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('agent')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                Agent <SortIcon field="agent" />
              </th>
              <th 
                onClick={() => handleSort('client')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                Client <SortIcon field="client" />
              </th>
              {activeTab === 'listings' && (
                <>
                  <th 
                    onClick={() => handleSort('property_type')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  >
                    Type <SortIcon field="property_type" />
                  </th>
                  <th 
                    onClick={() => handleSort('property_address')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  >
                    Address <SortIcon field="property_address" />
                  </th>
                  <th 
                    onClick={() => handleSort('county')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  >
                    County <SortIcon field="county" />
                  </th>
                </>
              )}
              <th 
                onClick={() => handleSort('status')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                Status <SortIcon field="status" />
              </th>
              <th 
                onClick={() => handleSort('agreement_date')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                Dates <SortIcon field="agreement_date" />
              </th>
              {activeTab === 'listings' && (
                <th 
                  onClick={() => handleSort('mls_number')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  MLS # <SortIcon field="mls_number" />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAgreements.map((agreement) => (
              <tr key={agreement.id}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {agreement.agent.first_name} {agreement.agent.last_name}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {agreement.client_last_name}, {agreement.client_first_name}
                  </div>
                </td>
                {activeTab === 'listings' && (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {agreement.property_type ? agreement.property_type.replace(/_/g, ' ') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {agreement.property_address ? (
                        <div>
                          <div className="text-sm text-gray-900">{agreement.property_address}</div>
                          <div className="text-sm text-gray-500">
                            {agreement.property_city && `${agreement.property_city}, `}
                            {agreement.property_state || 'UT'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {agreement.county ? agreement.county.replace(' County', '') : '—'}
                    </td>
                  </>
                )}
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    agreement.status === 'active' ? 'bg-green-100 text-green-800' :
                    agreement.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {agreement.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>{new Date(agreement.agreement_date).toLocaleDateString()}</div>
                  {agreement.expiration_date && (
                    <div className="text-xs text-gray-400">
                      exp {new Date(agreement.expiration_date).toLocaleDateString()}
                    </div>
                  )}
                </td>
                {activeTab === 'listings' && (
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {agreement.mls_number || '—'}
                  </td>
                )}
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/dashboard/agencies/${agreement.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {sortedAgreements.length === 0 && (
              <tr>
                <td colSpan={activeTab === 'listings' ? 9 : 5} className="px-6 py-8 text-center text-gray-500">
                  No {activeTab === 'listings' ? 'listings' : 'buyer agreements'} yet. Click the button above to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

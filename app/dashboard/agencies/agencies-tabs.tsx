'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, Users, ChevronUp, ChevronDown } from 'lucide-react'
import AgencyFilters from './agency-filters'

type Agreement = {
  id: string
  file_id?: string | null
  agreement_type: string
  agent_id?: string
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
  agents?: Array<{ id: string; first_name: string; last_name: string }>
}

export default function AgenciesTabs({ listings, buyerAgreements, role, agents }: Props) {
  const [activeTab, setActiveTab] = useState<'listings' | 'buyers'>('listings')
  const [sortField, setSortField] = useState<string>('agreement_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<any>({})
  const [filteredListings, setFilteredListings] = useState(listings)
  const [filteredBuyerAgreements, setFilteredBuyerAgreements] = useState(buyerAgreements)

  // Apply filters whenever they change or data changes
  useEffect(() => {
    const applyFilters = (agreements: Agreement[]) => {
      let filtered = agreements

      if (filters.agent) {
        filtered = filtered.filter(a => a.agent_id === filters.agent)
      }

      if (filters.client) {
        const clientSearch = filters.client.toLowerCase()
        filtered = filtered.filter(a => 
          `${a.client_first_name} ${a.client_last_name}`.toLowerCase().includes(clientSearch)
        )
      }

      if (filters.city) {
        const citySearch = filters.city.toLowerCase()
        filtered = filtered.filter(a => 
          a.property_city?.toLowerCase().includes(citySearch)
        )
      }

      if (filters.county) {
        filtered = filtered.filter(a => a.county === filters.county)
      }

      if (filters.status) {
        filtered = filtered.filter(a => a.status === filters.status)
      }

      if (filters.dateFrom) {
        filtered = filtered.filter(a => 
          a.agreement_date && a.agreement_date >= filters.dateFrom
        )
      }

      if (filters.dateTo) {
        filtered = filtered.filter(a => 
          a.agreement_date && a.agreement_date <= filters.dateTo
        )
      }

      return filtered
    }

    setFilteredListings(applyFilters(listings))
    setFilteredBuyerAgreements(applyFilters(buyerAgreements))
  }, [filters, listings, buyerAgreements])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedAgreements = [...(activeTab === 'listings' ? filteredListings : filteredBuyerAgreements)].sort((a, b) => {
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
    const isActive = sortField === field
    if (isActive) {
      return sortDirection === 'asc' ? 
        <ChevronUp className="w-4 h-4 inline ml-1 text-blue-600" /> : 
        <ChevronDown className="w-4 h-4 inline ml-1 text-blue-600" />
    }
    return <ChevronDown className="w-4 h-4 inline ml-1 text-gray-300" />
  }

  return (
    <div>
      {/* Tabs - VERY Prominent Design */}
      <div className="mb-8 bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Select Agreement Type:</h2>
        </div>
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 flex items-center justify-center gap-4 px-8 py-6 rounded-xl font-bold text-lg transition-all ${
              activeTab === 'listings'
                ? 'bg-green-600 text-white shadow-xl scale-105 ring-4 ring-green-300'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400 hover:shadow-lg hover:scale-102'
            }`}
          >
            <Home className="w-6 h-6" />
            <div className="text-left">
              <div>Listings</div>
              <div className={`text-sm font-normal ${activeTab === 'listings' ? 'text-green-100' : 'text-gray-500'}`}>
                Seller representation
              </div>
            </div>
            <span className={`ml-auto px-4 py-2 rounded-full text-base font-bold ${
              activeTab === 'listings' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {filteredListings.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('buyers')}
            className={`flex-1 flex items-center justify-center gap-4 px-8 py-6 rounded-xl font-bold text-lg transition-all ${
              activeTab === 'buyers'
                ? 'bg-blue-600 text-white shadow-xl scale-105 ring-4 ring-blue-300'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:shadow-lg hover:scale-102'
            }`}
          >
            <Users className="w-6 h-6" />
            <div className="text-left">
              <div>Buyer Agreements</div>
              <div className={`text-sm font-normal ${activeTab === 'buyers' ? 'text-blue-100' : 'text-gray-500'}`}>
                Buyer representation
              </div>
            </div>
            <span className={`ml-auto px-4 py-2 rounded-full text-base font-bold ${
              activeTab === 'buyers' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {filteredBuyerAgreements.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Filters */}
        <AgencyFilters
          options={{
            agents: agents || [],
            showAgentFilter: role === 'broker'
          }}
          onFilterChange={setFilters}
        />

        {/* Table */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('file_id')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                File ID <SortIcon field="file_id" />
              </th>
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
                <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">
                  {agreement.file_id || <span className="text-gray-400">—</span>}
                </td>
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
                <td colSpan={activeTab === 'listings' ? 10 : 6} className="px-6 py-8 text-center">
                  <p className="text-gray-600">No {activeTab === 'listings' ? 'listings' : 'buyer agreements'} found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {(activeTab === 'listings' ? listings.length : buyerAgreements.length) > 0 
                      ? 'Try adjusting your filters'
                      : 'Click the button above to create one'
                    }
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

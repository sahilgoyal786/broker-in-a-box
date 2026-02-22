'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface FilterOptions {
  agents: Array<{ id: string; first_name: string; last_name: string }>
  showAgentFilter: boolean
}

interface Filters {
  agent: string
  client: string
  city: string
  county: string
  status: string
  dateFrom: string
  dateTo: string
}

export default function TransactionFilters({
  options,
  onFilterChange
}: {
  options: FilterOptions
  onFilterChange: (filters: Filters) => void
}) {
  const [filters, setFilters] = useState<Filters>({
    agent: '',
    client: '',
    city: '',
    county: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })

  const [activeFilterCount, setActiveFilterCount] = useState(0)

  useEffect(() => {
    const count = Object.values(filters).filter(v => v !== '').length
    setActiveFilterCount(count)
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      agent: '',
      client: '',
      city: '',
      county: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  const utahCounties = [
    'Beaver', 'Box Elder', 'Cache', 'Carbon', 'Daggett', 'Davis', 'Duchesne',
    'Emery', 'Garfield', 'Grand', 'Iron', 'Juab', 'Kane', 'Millard', 'Morgan',
    'Piute', 'Rich', 'Salt Lake', 'San Juan', 'Sanpete', 'Sevier', 'Summit',
    'Tooele', 'Uintah', 'Utah', 'Wasatch', 'Washington', 'Wayne', 'Weber'
  ]

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <X className="w-3 h-3" />
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Agent Filter (only show for brokers) */}
        {options.showAgentFilter && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Agent</label>
            <select
              value={filters.agent}
              onChange={(e) => handleFilterChange('agent', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All agents</option>
              {options.agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.last_name}, {agent.first_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Client Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
          <input
            type="text"
            value={filters.client}
            onChange={(e) => handleFilterChange('client', e.target.value)}
            placeholder="Search client..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder="Search city..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* County Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">County</label>
          <select
            value={filters.county}
            onChange={(e) => handleFilterChange('county', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All counties</option>
            {utahCounties.map(county => (
              <option key={county} value={`${county} County`}>
                {county}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="under_contract">Under Contract</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}

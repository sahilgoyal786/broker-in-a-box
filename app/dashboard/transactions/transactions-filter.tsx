'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, FileText, X, Download } from 'lucide-react'

interface Transaction {
  id: string
  buyer_first_name: string
  buyer_last_name: string
  seller_first_name: string
  seller_last_name: string
  property_address: string
  property_city: string
  property_zip: string
  property_type: string
  transaction_type: string
  agency_role: string
  status: string
  created_at: string
  updated_at: string
  contract_date: string
  agent_id: string
  agents?: {
    first_name: string
    last_name: string
  }
}

interface Agent {
  id: string
  first_name: string
  last_name: string
}

interface FilterProps {
  transactions: Transaction[]
  agents?: Agent[]
  canCreate: boolean
}

export default function TransactionsFilter({ transactions, agents = [], canCreate }: FilterProps) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [nameSearch, setNameSearch] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [sideFilter, setSideFilter] = useState('all')
  const [citySearch, setCitySearch] = useState('')
  const [zipSearch, setZipSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Date range filter (using contract_date)
      if (dateFrom || dateTo) {
        const txDate = tx.contract_date ? new Date(tx.contract_date) : new Date(tx.created_at)
        if (dateFrom && txDate < new Date(dateFrom)) return false
        if (dateTo && txDate > new Date(dateTo)) return false
      }

      // Name search (buyer OR seller)
      if (nameSearch) {
        const search = nameSearch.toLowerCase()
        const buyerName = `${tx.buyer_first_name} ${tx.buyer_last_name}`.toLowerCase()
        const sellerName = `${tx.seller_first_name} ${tx.seller_last_name}`.toLowerCase()
        if (!buyerName.includes(search) && !sellerName.includes(search)) return false
      }

      // Agent filter (multi-select)
      if (selectedAgents.length > 0 && !selectedAgents.includes(tx.agent_id)) return false

      // Side filter (agency role)
      if (sideFilter !== 'all') {
        if (sideFilter === 'listing' && tx.agency_role !== 'listing_agent') return false
        if (sideFilter === 'buyer' && tx.agency_role !== 'buyer_agent') return false
        if (sideFilter === 'dual' && tx.agency_role !== 'dual_agency') return false
      }

      // City search
      if (citySearch && !tx.property_city?.toLowerCase().includes(citySearch.toLowerCase())) return false

      // Zip search
      if (zipSearch && !tx.property_zip?.includes(zipSearch)) return false

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending') {
          // Pending includes: pending, under_contract, pending_closure, pending_cancellation
          if (!['pending', 'under_contract', 'pending_closure', 'pending_cancellation'].includes(tx.status)) return false
        } else if (tx.status !== statusFilter) {
          return false
        }
      }

      return true
    })
  }, [transactions, dateFrom, dateTo, nameSearch, selectedAgents, sideFilter, citySearch, zipSearch, statusFilter])

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setNameSearch('')
    setSelectedAgents([])
    setSideFilter('all')
    setCitySearch('')
    setZipSearch('')
    setStatusFilter('all')
  }

  function toggleAgent(agentId: string) {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  function removeAgent(agentId: string) {
    setSelectedAgents(prev => prev.filter(id => id !== agentId))
  }

  function exportToCSV() {
    const headers = agents.length > 0 
      ? ['Date', 'Agent', 'Client', 'Property', 'City', 'Zip', 'Side', 'Status']
      : ['Date', 'Client', 'Property', 'City', 'Zip', 'Side', 'Status']
    
    const rows = filteredTransactions.map(tx => {
      const baseRow = [
        tx.contract_date || tx.created_at,
        `${tx.buyer_last_name}, ${tx.buyer_first_name}`,
        tx.property_address,
        tx.property_city,
        tx.property_zip,
        tx.agency_role === 'listing_agent' ? 'Listing' : tx.agency_role === 'buyer_agent' ? 'Buyer' : 'Dual',
        tx.status
      ]
      
      if (agents.length > 0 && tx.agents) {
        return [
          tx.contract_date || tx.created_at,
          `${tx.agents.last_name}, ${tx.agents.first_name}`,
          ...baseRow.slice(1)
        ]
      }
      
      return baseRow
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const hasActiveFilters = dateFrom || dateTo || nameSearch || selectedAgents.length > 0 || sideFilter !== 'all' || citySearch || zipSearch || statusFilter !== 'all'

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    under_contract: 'bg-green-500/20 text-green-400 border-green-500/30',
    closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending_closure: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pending_cancellation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  }

  return (
    <div>
      {/* Filter Bar */}
      <div className="mb-6 bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            🔍 Filter Transactions
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Name Search */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Name (Buyer or Seller)</label>
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Search name..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Agent Filter (Broker only - Multi-select) */}
          {agents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Agent {selectedAgents.length > 0 && `(${selectedAgents.length} selected)`}
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    toggleAgent(e.target.value)
                    e.target.value = '' // Reset dropdown
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value=""
              >
                <option value="">Select agents...</option>
                {agents.filter(a => !selectedAgents.includes(a.id)).map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.last_name}, {agent.first_name}
                  </option>
                ))}
              </select>
              {selectedAgents.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAgents.map(agentId => {
                    const agent = agents.find(a => a.id === agentId)
                    if (!agent) return null
                    return (
                      <button
                        key={agentId}
                        onClick={() => removeAgent(agentId)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                      >
                        {agent.last_name}, {agent.first_name}
                        <X className="w-3 h-3" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Side Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Side</label>
            <select
              value={sideFilter}
              onChange={(e) => setSideFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sides</option>
              <option value="listing">Listing Side</option>
              <option value="buyer">Buyer Side</option>
              <option value="dual">Dual Agency</option>
            </select>
          </div>

          {/* City Search */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">City</label>
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search city..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Zip Search */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Zip Code</label>
            <input
              type="text"
              value={zipSearch}
              onChange={(e) => setZipSearch(e.target.value)}
              placeholder="Search zip..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending (Under Contract)</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Export Button */}
          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          Showing <span className="text-white font-semibold">{filteredTransactions.length}</span> of {transactions.length} transactions
        </div>
      </div>

      {/* Results */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-16 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No transactions found</h3>
          <p className="text-slate-400 text-sm mb-6">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first transaction to get started'}
          </p>
          {canCreate && (
            <Link
              href="/dashboard/transactions/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Transaction
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Client</th>
                {agents.length > 0 && (
                  <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Agent</th>
                )}
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Property</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Side</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-700/40 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/transactions/${tx.id}`} className="block">
                      <p className="text-white font-medium text-sm">
                        {tx.buyer_last_name}, {tx.buyer_first_name}
                      </p>
                      {tx.seller_first_name && (
                        <p className="text-slate-500 text-xs mt-0.5">
                          Seller: {tx.seller_first_name} {tx.seller_last_name}
                        </p>
                      )}
                    </Link>
                  </td>
                  {agents.length > 0 && (
                    <td className="px-6 py-4">
                      <p className="text-slate-300 text-sm">
                        {tx.agents 
                          ? `${tx.agents.last_name}, ${tx.agents.first_name}`
                          : <span className="text-slate-500 italic">Unassigned</span>
                        }
                      </p>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/transactions/${tx.id}`} className="block">
                      <p className="text-white text-sm">{tx.property_address}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {tx.property_city}{tx.property_zip && `, ${tx.property_zip}`}
                      </p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300 text-sm">
                      {tx.agency_role === 'listing_agent' ? 'Listing' : 
                       tx.agency_role === 'buyer_agent' ? 'Buyer' : 'Dual'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium ${statusColors[tx.status] || 'bg-slate-700 text-slate-400'}`}>
                      {tx.status === 'pending_closure' ? 'CTP Review' :
                       tx.status === 'pending_cancellation' ? 'Cancel Review' :
                       tx.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-400 text-sm">
                      {tx.contract_date 
                        ? new Date(tx.contract_date).toLocaleDateString()
                        : new Date(tx.created_at).toLocaleDateString()
                      }
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

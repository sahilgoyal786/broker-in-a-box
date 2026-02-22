'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { getViewContext } from '@/lib/get-view-context'

interface Transaction {
  id: string
  buyer_first_name: string
  buyer_last_name: string
  seller_first_name: string | null
  seller_last_name: string | null
  property_address: string
  property_city: string
  property_zip: string
  property_type: string
  transaction_type: string
  status: string
  created_at: string
  updated_at: string
  contract_date: string | null
  purchase_price: number | null
  anticipated_closing_date: string | null
  county: string | null
  agent_id: string
  agents: {
    first_name: string
    last_name: string
  }
}

type SortField = 'agent' | 'role' | 'type' | 'client' | 'address' | 'county' | 'price' | 'settlement' | 'status'
type SortDirection = 'asc' | 'desc'

export default function TransactionsTable({ 
  transactions, 
  userRole,
  onFilterChange
}: { 
  transactions: Transaction[]
  userRole: string
  onFilterChange?: (count: number) => void
}) {
  const [filteredTransactions, setFilteredTransactions] = useState(transactions)
  const [sortField, setSortField] = useState<SortField>('settlement')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    const { viewingAsAgent, impersonateAgentId } = getViewContext()
    
    let filtered = transactions
    if (userRole === 'broker' && viewingAsAgent && impersonateAgentId) {
      filtered = transactions.filter(t => t.agent_id === impersonateAgentId)
    }
    
    setFilteredTransactions(filtered)
    
    if (onFilterChange) {
      onFilterChange(filtered.length)
    }
  }, [transactions, userRole, onFilterChange])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aVal: any
    let bVal: any

    switch (sortField) {
      case 'agent':
        aVal = `${a.agents.last_name} ${a.agents.first_name}`
        bVal = `${b.agents.last_name} ${b.agents.first_name}`
        break
      case 'role':
        aVal = a.transaction_type
        bVal = b.transaction_type
        break
      case 'type':
        aVal = a.property_type
        bVal = b.property_type
        break
      case 'client':
        // Sort by client name (buyer for buyer_agency, seller for listing)
        if (a.transaction_type === 'listing') {
          aVal = `${a.seller_last_name || ''} ${a.seller_first_name || ''}`
        } else {
          aVal = `${a.buyer_last_name} ${a.buyer_first_name}`
        }
        if (b.transaction_type === 'listing') {
          bVal = `${b.seller_last_name || ''} ${b.seller_first_name || ''}`
        } else {
          bVal = `${b.buyer_last_name} ${b.buyer_first_name}`
        }
        break
      case 'address':
        aVal = a.property_address || ''
        bVal = b.property_address || ''
        break
      case 'county':
        aVal = a.county || ''
        bVal = b.county || ''
        break
      case 'price':
        aVal = a.purchase_price || 0
        bVal = b.purchase_price || 0
        break
      case 'settlement':
        aVal = a.anticipated_closing_date || ''
        bVal = b.anticipated_closing_date || ''
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="text-left px-4 py-3 text-sm font-medium cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ChevronUp className="w-4 h-4 text-blue-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-blue-600" />
          )
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-300" />
        )}
      </div>
    </th>
  )

  const propTypeLabels: Record<string, string> = {
    residential: 'Residential',
    vacant_land: 'Vacant Land',
    mobile_home: 'Mobile Home',
    commercial: 'Commercial',
    multi_unit: 'Multi-Unit',
    farm: 'Farm',
    residential_lease: 'Residential Lease',
  }

  const roleLabels: Record<string, string> = {
    listing: 'Listing',
    buyer_agency: 'Buyer',
    limited_agency: 'Limited',
    // Legacy values (map to new labels)
    seller_purchase: 'Limited',
    buyer_purchase: 'Buyer',
    unrepresented_buyer: 'Buyer',
    fsbo_purchase: 'Buyer',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    under_contract: 'Under Contract',
    closed: 'Closed',
    cancelled: 'Cancelled',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    under_contract: 'bg-blue-100 text-blue-800 border-blue-200',
    closed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }

  if (!filteredTransactions || filteredTransactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-600">No transactions yet</p>
        <p className="text-gray-400 text-sm mt-1">Create your first transaction to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {userRole === 'broker' && <SortableHeader field="agent">Agent</SortableHeader>}
              <SortableHeader field="role">Role</SortableHeader>
              <SortableHeader field="type">Type</SortableHeader>
              <SortableHeader field="client">Client</SortableHeader>
              <SortableHeader field="address">Address</SortableHeader>
              <SortableHeader field="county">County</SortableHeader>
              <SortableHeader field="price">Sales Price</SortableHeader>
              <SortableHeader field="settlement">Settlement Deadline</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTransactions.map((tx) => {
              // Determine client name based on role
              const clientName = tx.transaction_type === 'listing'
                ? (tx.seller_last_name && tx.seller_first_name 
                    ? `${tx.seller_last_name}, ${tx.seller_first_name}`
                    : '—')
                : `${tx.buyer_last_name}, ${tx.buyer_first_name}`

              return (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  {userRole === 'broker' && (
                    <td className="px-4 py-3 text-sm">
                      {tx.agents.last_name}, {tx.agents.first_name}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm">
                    {roleLabels[tx.transaction_type] || 'Buyer'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {propTypeLabels[tx.property_type]}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {clientName}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{tx.property_address || <span className="text-gray-400">—</span>}</div>
                    {tx.property_city && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {tx.property_city}, UT {tx.property_zip}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {tx.county ? tx.county.replace(' County', '') : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {tx.purchase_price 
                      ? `$${tx.purchase_price.toLocaleString()}`
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {tx.anticipated_closing_date 
                      ? new Date(tx.anticipated_closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[tx.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {statusLabels[tx.status] || tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/dashboard/transactions/${tx.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

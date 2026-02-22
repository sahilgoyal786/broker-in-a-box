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
  agent_id: string
  agents: {
    first_name: string
    last_name: string
  }
}

type SortField = 'agent' | 'buyer' | 'seller' | 'address' | 'type' | 'status' | 'contract_date' | 'price'
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
  const [sortField, setSortField] = useState<SortField>('contract_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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
      case 'buyer':
        aVal = `${a.buyer_last_name} ${a.buyer_first_name}`
        bVal = `${b.buyer_last_name} ${b.buyer_first_name}`
        break
      case 'seller':
        aVal = `${a.seller_last_name || ''} ${a.seller_first_name || ''}`
        bVal = `${b.seller_last_name || ''} ${b.seller_first_name || ''}`
        break
      case 'address':
        aVal = a.property_address || ''
        bVal = b.property_address || ''
        break
      case 'type':
        aVal = a.property_type
        bVal = b.property_type
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'contract_date':
        aVal = a.contract_date || ''
        bVal = b.contract_date || ''
        break
      case 'price':
        aVal = a.purchase_price || 0
        bVal = b.purchase_price || 0
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
    listing: 'Listing Agent',
    buyer_agency: 'Buyer\'s Agent',
    limited_agency: 'Limited Agency',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    under_contract: 'Under Contract',
    closed: 'Closed',
    cancelled: 'Cancelled',
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
              <SortableHeader field="buyer">Buyer</SortableHeader>
              <SortableHeader field="seller">Seller</SortableHeader>
              <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
              <SortableHeader field="address">Property</SortableHeader>
              <SortableHeader field="type">Type</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="contract_date">Contract Date</SortableHeader>
              <SortableHeader field="price">Price</SortableHeader>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                {userRole === 'broker' && (
                  <td className="px-4 py-3 text-sm">
                    {tx.agents.last_name}, {tx.agents.first_name}
                  </td>
                )}
                <td className="px-4 py-3 text-sm">
                  {tx.buyer_last_name}, {tx.buyer_first_name}
                </td>
                <td className="px-4 py-3 text-sm">
                  {tx.seller_last_name && tx.seller_first_name
                    ? `${tx.seller_last_name}, ${tx.seller_first_name}`
                    : <span className="text-gray-400">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {roleLabels[tx.transaction_type] || tx.transaction_type}
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
                  {propTypeLabels[tx.property_type]}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                    tx.status === 'closed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'under_contract' ? 'bg-blue-100 text-blue-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {statusLabels[tx.status] || tx.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {tx.contract_date 
                    ? new Date(tx.contract_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : <span className="text-gray-400">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {tx.purchase_price 
                    ? `$${tx.purchase_price.toLocaleString()}`
                    : <span className="text-gray-400">—</span>
                  }
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

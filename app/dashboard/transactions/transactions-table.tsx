'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  agency_role: string
  status: string
  created_at: string
  updated_at: string
  contract_date: string | null
  agent_id: string
  agents: {
    first_name: string
    last_name: string
  }
}

export default function TransactionsTable({ 
  transactions, 
  userRole 
}: { 
  transactions: Transaction[]
  userRole: string
}) {
  const [filteredTransactions, setFilteredTransactions] = useState(transactions)

  useEffect(() => {
    const { viewingAsAgent, impersonateAgentId } = getViewContext()
    
    if (userRole === 'broker' && viewingAsAgent && impersonateAgentId) {
      // Filter to selected agent's transactions
      setFilteredTransactions(transactions.filter(t => t.agent_id === impersonateAgentId))
    } else {
      // Show all (broker normal mode or actual agent)
      setFilteredTransactions(transactions)
    }
  }, [transactions, userRole])

  const statusColors: Record<string, string> = {
    active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    under_contract: 'bg-green-500/20 text-green-400 border-green-500/30',
    closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const propTypeLabels: Record<string, string> = {
    residential: 'Residential',
    vacant_land: 'Vacant Land',
    mobile_home: 'Mobile Home',
    commercial: 'Commercial',
    multi_unit: 'Multi-Unit',
    farm: 'Farm',
    residential_lease: 'Residential Lease',
  }

  if (!filteredTransactions || filteredTransactions.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
        <p className="text-slate-400">No transactions yet</p>
        <p className="text-slate-500 text-sm mt-1">Create your first transaction to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900">
              <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Client</th>
              {userRole === 'broker' && (
                <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Agent</th>
              )}
              <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Property</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Type</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Status</th>
              <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredTransactions.map((tx) => {
              const clientName = tx.agency_role === 'listing_agent'
                ? `${tx.seller_first_name || ''} ${tx.seller_last_name || ''}`
                : `${tx.buyer_first_name} ${tx.buyer_last_name}`

              return (
                <tr key={tx.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/transactions/${tx.id}`} className="text-white hover:text-blue-400 font-medium">
                      {clientName}
                    </Link>
                  </td>
                  {userRole === 'broker' && (
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      {tx.agents.first_name} {tx.agents.last_name}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="text-slate-300 text-sm">
                      {tx.property_address || <span className="italic text-slate-500">No address</span>}
                    </div>
                    {tx.property_city && (
                      <div className="text-slate-500 text-xs mt-0.5">
                        {tx.property_city}, {tx.property_zip}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300 text-sm">{propTypeLabels[tx.property_type]}</div>
                    <div className="text-slate-500 text-xs mt-0.5">
                      {tx.agency_role === 'listing_agent' ? 'Listing' : 'Buyer'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[tx.status]}`}>
                      {tx.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(tx.updated_at).toLocaleDateString()}
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

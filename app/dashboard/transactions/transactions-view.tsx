'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TransactionsTable from './transactions-table'

export default function TransactionsView({ 
  transactions, 
  userRole,
  agents
}: { 
  transactions: any[]
  userRole: string
  agents?: Array<{ id: string; first_name: string; last_name: string }>
}) {
  const [displayCount, setDisplayCount] = useState(transactions.length)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Contracts</h1>
        <p className="text-gray-500 mt-1">{displayCount} total • Create from active agency detail page</p>
      </div>

      <TransactionsTable 
        transactions={transactions} 
        userRole={userRole}
        agents={agents}
        onFilterChange={setDisplayCount}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TransactionsTable from './transactions-table'

export default function TransactionsView({ 
  transactions, 
  userRole 
}: { 
  transactions: any[]
  userRole: string
}) {
  const [displayCount, setDisplayCount] = useState(transactions.length)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Contracts</h1>
          <p className="text-gray-500 mt-1">{displayCount} total</p>
        </div>
        <Link
          href="/dashboard/transactions/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Purchase Contract
        </Link>
      </div>

      <TransactionsTable 
        transactions={transactions} 
        userRole={userRole}
        onFilterChange={setDisplayCount}
      />
    </div>
  )
}

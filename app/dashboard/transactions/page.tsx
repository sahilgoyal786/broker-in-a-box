import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', user!.id)
    .single() as any

  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id,
      client_last_name,
      client_first_name,
      property_address,
      property_type,
      transaction_type,
      status,
      created_at,
      updated_at
    `)
    .eq('broker_id', broker?.id ?? '')
    .order('updated_at', { ascending: false }) as any

  const statusColors: Record<string, string> = {
    active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    under_contract: 'bg-green-500/20 text-green-400 border-green-500/30',
    closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const txTypeLabels: Record<string, string> = {
    listing: 'Listing',
    buyer_agency: 'Buyer Agency',
    seller_purchase: 'Seller / Purchase',
    buyer_purchase: 'Buyer / Purchase',
    unrepresented_buyer: 'Unrepresented Buyer',
    fsbo_purchase: 'FSBO Purchase',
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 mt-1">{transactions?.length ?? 0} total</p>
        </div>
        <Link
          href="/dashboard/transactions/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Transaction
        </Link>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-16 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No transactions yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Create your first transaction to start tracking compliance.
          </p>
          <Link
            href="/dashboard/transactions/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Property</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-700/40 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/transactions/${tx.id}`} className="block">
                      <p className="text-white font-medium text-sm">
                        {tx.client_last_name}, {tx.client_first_name}
                      </p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300 text-sm">
                      {tx.property_address ?? <span className="text-slate-500 italic">No address</span>}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">{propTypeLabels[tx.property_type]}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300 text-sm">{txTypeLabels[tx.transaction_type]}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[tx.status]}`}>
                      {tx.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-500 text-xs">
                      {new Date(tx.updated_at).toLocaleDateString()}
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

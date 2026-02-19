import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id, name')
    .eq('auth_user_id', user!.id)
    .single()

  // Stats
  const [{ count: totalTx }, { count: activeTx }, { count: underContract }] = await Promise.all([
    supabase.from('transactions').select('*', { count: 'exact', head: true })
      .eq('broker_id', broker?.id ?? ''),
    supabase.from('transactions').select('*', { count: 'exact', head: true })
      .eq('broker_id', broker?.id ?? '').eq('status', 'active'),
    supabase.from('transactions').select('*', { count: 'exact', head: true })
      .eq('broker_id', broker?.id ?? '').eq('status', 'under_contract'),
  ])

  // Recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('id, client_last_name, client_first_name, property_address, property_type, transaction_type, status, created_at')
    .eq('broker_id', broker?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Total Transactions', value: totalTx ?? 0, icon: FileText, color: 'text-blue-400' },
    { label: 'Active', value: activeTx ?? 0, icon: Clock, color: 'text-yellow-400' },
    { label: 'Under Contract', value: underContract ?? 0, icon: CheckCircle, color: 'text-green-400' },
  ]

  const statusColors: Record<string, string> = {
    active: 'bg-yellow-500/20 text-yellow-400',
    under_contract: 'bg-green-500/20 text-green-400',
    closed: 'bg-slate-500/20 text-slate-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, {broker?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-sm">{label}</p>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-white font-semibold">Recent Transactions</h2>
          <Link
            href="/dashboard/transactions"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            View all →
          </Link>
        </div>

        {!recentTransactions || recentTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No transactions yet</p>
            <Link
              href="/dashboard/transactions/new"
              className="mt-4 inline-block text-blue-400 hover:text-blue-300 text-sm"
            >
              Create your first transaction →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {recentTransactions.map((tx) => (
              <Link
                key={tx.id}
                href={`/dashboard/transactions/${tx.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
              >
                <div>
                  <p className="text-white font-medium text-sm">
                    {tx.client_last_name}, {tx.client_first_name}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {tx.property_address ?? 'No address yet'} ·{' '}
                    {tx.property_type.replace('_', ' ')} ·{' '}
                    {tx.transaction_type.replace('_', ' ')}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[tx.status]}`}>
                  {tx.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

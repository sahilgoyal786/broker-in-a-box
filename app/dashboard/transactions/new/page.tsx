import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewTransactionForm from './new-transaction-form'

export default async function NewTransactionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single() as any

  const { data: agents } = await supabase
    .from('agents')
    .select('id, first_name, last_name')
    .eq('broker_id', broker?.id ?? '')
    .order('last_name', { ascending: true }) as any

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <a href="/dashboard/transactions" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Back to Transactions
        </a>
        <h1 className="text-2xl font-bold text-white mt-4">New Transaction</h1>
        <p className="text-slate-400 mt-1">Create a new transaction to start tracking compliance.</p>
      </div>

      <NewTransactionForm
        brokerId={broker?.id ?? ''}
        agents={agents ?? []}
      />
    </div>
  )
}

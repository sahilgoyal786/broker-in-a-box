import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditTransactionForm from './edit-transaction-form'
import { getUserContext } from '@/lib/supabase/get-user-role'

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { role, brokerId, agentId } = await getUserContext()

  if (!brokerId) redirect('/auth/login')

  // Fetch transaction
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*, agent:agents(first_name, last_name)')
    .eq('id', params.id)
    .single() as any

  if (error || !transaction) notFound()

  // Check permission (broker or assigned agent only)
  const canEdit = role === 'broker' || (role === 'agent' && transaction.agent_id === agentId)
  if (!canEdit) {
    return (
      <div className="p-8">
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg p-4">
          You don&apos;t have permission to edit this transaction.
        </div>
      </div>
    )
  }

  // Fetch agents for dropdown (broker can reassign, agent cannot)
  const { data: agents } = await supabase
    .from('agents')
    .select('id, first_name, last_name')
    .eq('broker_id', brokerId)
    .order('last_name') as any

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Transaction</h1>
        <p className="text-slate-400 mt-1">
          Update transaction details and deadlines
        </p>
      </div>

      <EditTransactionForm 
        transaction={transaction} 
        agents={agents || []}
        isAgent={role === 'agent'}
      />
    </div>
  )
}

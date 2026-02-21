import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import TransactionsFilter from './transactions-filter'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')

  // Build query based on role
  let query = supabase
    .from('transactions')
    .select(`
      id,
      buyer_first_name,
      buyer_last_name,
      seller_first_name,
      seller_last_name,
      property_address,
      property_city,
      property_zip,
      property_type,
      transaction_type,
      agency_role,
      status,
      created_at,
      updated_at,
      contract_date,
      agent_id,
      agents (
        first_name,
        last_name
      )
    `)
    .order('updated_at', { ascending: false })

  if (userContext.role === 'broker') {
    // Brokers see all transactions for their brokerage
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single() as any
    
    if (!broker) redirect('/auth/login')
    query = query.eq('broker_id', broker.id)
  } else {
    // Agents see only their own transactions
    query = query.eq('agent_id', userContext.agentId!)
  }

  const { data: transactions } = await query as any

  // Get list of agents for broker filter
  let agents: any[] = []
  if (userContext.role === 'broker') {
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single() as any
    
    const { data: agentsList } = await supabase
      .from('agents')
      .select('id, first_name, last_name')
      .eq('broker_id', broker?.id ?? '')
      .eq('active', true)
      .order('last_name', { ascending: true }) as any
    
    agents = agentsList ?? []
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 mt-1">{transactions?.length ?? 0} total</p>
        </div>
        {userContext.role === 'broker' && (
          <Link
            href="/dashboard/transactions/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </Link>
        )}
      </div>

      <TransactionsFilter 
        transactions={transactions ?? []} 
        agents={agents}
        canCreate={userContext.role === 'broker'}
      />
    </div>
  )
}

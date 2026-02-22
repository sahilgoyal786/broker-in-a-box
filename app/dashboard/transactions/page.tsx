import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import TransactionsView from './transactions-view'

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
      status,
      created_at,
      updated_at,
      contract_date,
      purchase_price,
      anticipated_closing_date,
      county,
      agent_id,
      agents (
        first_name,
        last_name
      )
    `)
    .order('anticipated_closing_date', { ascending: true })

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
    <TransactionsView 
      transactions={transactions ?? []} 
      userRole={userContext.role}
      agents={agents}
    />
  )
}

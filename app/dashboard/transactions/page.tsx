import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import TransactionsView from './transactions-view'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transactions',
}

export default async function TransactionsPage() {
  const supabase = await createClient()

  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')

  // Build query based on role
  let query = supabase
    .from('transactions')
    .select(`
      id,
      file_id,
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
      agents:agents!agent_id(
        first_name,
        last_name
      )
    `)
    .order('anticipated_closing_date', { ascending: true })

  if (userContext.role === 'broker') {
    query = query.eq('broker_id', userContext.brokerId)
  } else {
    // Agents see only their own transactions
    query = query.eq('agent_id', userContext.agentId!)
  }

  // Fetch transactions and (for brokers) the agent filter list in parallel
  const [{ data: transactions }, { data: agentsList }] = await Promise.all([
    query,
    userContext.role === 'broker'
      ? supabase.from('agents')
          .select('id, first_name, last_name')
          .eq('broker_id', userContext.brokerId)
          .eq('active', true)
          .order('last_name', { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
  ]) as any

  const agents = agentsList ?? []

  return (
    <TransactionsView 
      transactions={transactions ?? []} 
      userRole={userContext.role}
      agents={agents}
    />
  )
}

import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect } from 'next/navigation'
import NewTransactionForm from './new-transaction-form'

export default async function NewTransactionPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')
  const role = userContext.role

  // Get broker ID
  let brokerId: string
  let agents: any[] = []
  let currentAgentId: string | null = null

  if (role === 'broker') {
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single() as any

    if (!broker) redirect('/auth/login')
    brokerId = broker.id

    const { data: agentsList } = await supabase
      .from('agents')
      .select('*')
      .eq('broker_id', broker.id)
      .order('first_name') as any
    
    agents = agentsList || []
  } else {
    const { data: agent } = await supabase
      .from('agents')
      .select('id, broker_id, first_name, last_name')
      .eq('auth_user_id', user.id)
      .single() as any

    if (!agent) redirect('/auth/login')
    brokerId = agent.broker_id
    currentAgentId = agent.id
    agents = [agent]
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">New Purchase Contract</h1>
      <NewTransactionForm 
        brokerId={brokerId} 
        agents={agents} 
        currentAgentId={currentAgentId}
        isAgent={role === 'agent'}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewTransactionForm from './new-transaction-form'
import { getUserContext } from '@/lib/supabase/get-user-role'

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ agency?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')

  let brokerId: string
  let agents: any[] = []
  let currentAgentId: string | null = null

  if (userContext.role === 'broker') {
    // Broker: get broker_id and all agents
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single() as any

    if (!broker) redirect('/auth/login')
    brokerId = broker.id

    const { data: agentsList } = await supabase
      .from('agents')
      .select('id, first_name, last_name')
      .eq('broker_id', broker.id)
      .order('last_name', { ascending: true }) as any
    
    agents = agentsList || []
  } else {
    // Agent: get agent's broker_id and set current agent
    const { data: agent } = await supabase
      .from('agents')
      .select('id, broker_id, first_name, last_name')
      .eq('auth_user_id', user.id)
      .single() as any

    if (!agent) redirect('/auth/login')
    brokerId = agent.broker_id
    currentAgentId = agent.id
    agents = [agent] // Only show self in dropdown
  }

  // Optionally load agency agreement if provided
  let agency = null
  if (params.agency) {
    const { data } = await supabase
      .from('agency_agreements')
      .select('*')
      .eq('id', params.agency)
      .eq('broker_id', brokerId)
      .single() as any
    agency = data
  }

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
        brokerId={brokerId}
        agents={agents}
        agency={agency}
        currentAgentId={currentAgentId}
        isAgent={userContext.role === 'agent'}
      />
    </div>
  )
}

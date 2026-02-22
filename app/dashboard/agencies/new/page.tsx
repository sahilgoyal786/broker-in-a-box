import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewAgencyForm from './new-agency-form'
import { getUserContext } from '@/lib/supabase/get-user-role'

export default async function NewAgencyPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')

  const params = await searchParams
  const agreementType = params.type === 'buyer' ? 'buyer_agency_agreement' : 'listing_agreement'

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
      .select('*')
      .eq('broker_id', broker.id)
      .order('last_name')
      .order('first_name') as any
    
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {agreementType === 'listing_agreement' ? 'New Listing Agreement' : 'New Buyer Agency Agreement'}
      </h1>
      <NewAgencyForm 
        brokerId={brokerId} 
        agents={agents} 
        currentAgentId={currentAgentId}
        isAgent={userContext.role === 'agent'}
        agreementType={agreementType}
      />
    </div>
  )
}

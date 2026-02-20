import { createClient } from './server'

export type UserRole = 'broker' | 'agent'

export interface UserContext {
  role: UserRole
  brokerId: string
  agentId?: string
  userId: string
}

export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Check if user is a broker
  const { data: broker } = await supabase
    .from('brokers')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single() as any

  if (broker?.role === 'broker') {
    return {
      role: 'broker',
      brokerId: broker.id,
      userId: user.id
    }
  }

  // Check if user is an agent
  const { data: agent } = await supabase
    .from('agents')
    .select('id, broker_id, role')
    .eq('auth_user_id', user.id)
    .single() as any

  if (agent?.role === 'agent') {
    return {
      role: 'agent',
      brokerId: agent.broker_id,
      agentId: agent.id,
      userId: user.id
    }
  }

  // If they have a broker record but no role set, default to broker
  if (broker) {
    return {
      role: 'broker',
      brokerId: broker.id,
      userId: user.id
    }
  }

  return null
}

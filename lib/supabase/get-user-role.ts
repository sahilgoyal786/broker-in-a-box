import { cache } from 'react'
import { createClient } from './server'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'broker' | 'agent'

export interface UserContext {
  role: UserRole
  brokerId: string
  agentId?: string
  userId: string
  brokerName?: string
  brokerEmail?: string
  agentFirstName?: string
  agentLastName?: string
}

// Memoized per-request: repeated calls across the layout and page server
// components in the same navigation only hit Supabase once.
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user
})

export const getUserContext = cache(async (): Promise<UserContext | null> => {
  const supabase = await createClient()
  const user = await getAuthUser()

  if (!user) return null

  // Check if user is a broker
  const { data: broker } = await supabase
    .from('brokers')
    .select('id, role, name, email')
    .eq('auth_user_id', user.id)
    .single() as any

  if (broker?.role === 'broker') {
    return {
      role: 'broker',
      brokerId: broker.id,
      userId: user.id,
      brokerName: broker.name,
      brokerEmail: broker.email,
    }
  }

  // Check if user is an agent
  const { data: agent } = await supabase
    .from('agents')
    .select('id, broker_id, role, first_name, last_name')
    .eq('auth_user_id', user.id)
    .single() as any

  if (agent?.role === 'agent') {
    return {
      role: 'agent',
      brokerId: agent.broker_id,
      agentId: agent.id,
      userId: user.id,
      agentFirstName: agent.first_name,
      agentLastName: agent.last_name,
    }
  }

  // If they have a broker record but no role set, default to broker
  if (broker) {
    return {
      role: 'broker',
      brokerId: broker.id,
      userId: user.id,
      brokerName: broker.name,
      brokerEmail: broker.email,
    }
  }

  return null
})

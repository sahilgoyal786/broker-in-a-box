/**
 * Client-side utility to get current view context (broker or impersonating agent)
 * Used for testing: brokers can "work as agent" to test agent permissions
 */

export interface ViewContext {
  viewingAsAgent: boolean
  impersonateAgentId: string | null
}

export function getViewContext(): ViewContext {
  if (typeof window === 'undefined') {
    return { viewingAsAgent: false, impersonateAgentId: null }
  }

  const impersonateAgentId = localStorage.getItem('impersonate_agent_id')
  
  return {
    viewingAsAgent: !!impersonateAgentId && impersonateAgentId !== 'null',
    impersonateAgentId: impersonateAgentId && impersonateAgentId !== 'null' ? impersonateAgentId : null
  }
}

/**
 * Filter query for transactions based on view context
 * If viewing as agent, only return that agent's transactions
 */
export function applyViewFilter(query: any, userRole: string, actualAgentId?: string) {
  const { viewingAsAgent, impersonateAgentId } = getViewContext()
  
  // If broker viewing as agent, filter to that agent's transactions
  if (userRole === 'broker' && viewingAsAgent && impersonateAgentId) {
    return query.eq('agent_id', impersonateAgentId)
  }
  
  // If actual agent, filter to their own transactions (RLS enforced anyway)
  if (userRole === 'agent' && actualAgentId) {
    return query.eq('agent_id', actualAgentId)
  }
  
  // Broker in normal mode sees all
  return query
}

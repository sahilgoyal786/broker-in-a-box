'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Mail, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Agent {
  id: string
  first_name: string
  last_name: string
  email: string
  license_number: string
  license_expiration: string | null
  ce_hours_core: number
  ce_hours_other: number
  mandatory_course_completed: boolean
  invite_status: string
  activeListings: number
  pendingSales: number
  closedDeals: number
  daysUntilExpiration: number | null
  nar_code_of_ethics_date: string | null
  nar_code_of_ethics_cert_url: string | null
  nar_fair_housing_date: string | null
  nar_fair_housing_cert_url: string | null
  nar_cycle_end: string | null
}

export default function AgentsTable({ agents }: { agents: Agent[] }) {
  const router = useRouter()
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState(false)

  function toggleAgent(agentId: string) {
    const newSelected = new Set(selectedAgents)
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId)
    } else {
      newSelected.add(agentId)
    }
    setSelectedAgents(newSelected)
  }

  function toggleAll() {
    if (selectedAgents.size === agents.length) {
      setSelectedAgents(new Set())
    } else {
      setSelectedAgents(new Set(agents.map(a => a.id)))
    }
  }

  async function handleUpdateLicenseDates() {
    if (selectedAgents.size === 0) {
      alert('Please select at least one agent')
      return
    }

    const selectedAgentsList = agents.filter(a => selectedAgents.has(a.id))
    const agentNames = selectedAgentsList.map(a => `${a.first_name} ${a.last_name}`).join(', ')
    
    const confirmMessage = `Update license expiration for ${selectedAgents.size} agent${selectedAgents.size > 1 ? 's' : ''}?\n\n${agentNames}\n\nThis will add 2 years to each agent's current expiration date.`
    
    if (!confirm(confirmMessage)) return

    setUpdating(true)
    const supabase = createClient()

    try {
      // Update each selected agent
      for (const agent of selectedAgentsList) {
        if (!agent.license_expiration) {
          alert(`${agent.first_name} ${agent.last_name} has no expiration date set. Skipping.`)
          continue
        }

        const currentDate = new Date(agent.license_expiration)
        const newDate = new Date(currentDate)
        newDate.setFullYear(newDate.getFullYear() + 2)

        const { error } = await supabase
          .from('agents')
          .update({ 
            license_expiration: newDate.toISOString().split('T')[0]
          })
          .eq('id', agent.id) as any

        if (error) {
          alert(`Error updating ${agent.first_name} ${agent.last_name}: ${error.message}`)
        }
      }

      setSelectedAgents(new Set())
      router.refresh()
    } finally {
      setUpdating(false)
    }
  }

  function handleEmailSelected() {
    if (selectedAgents.size === 0) {
      alert('Please select at least one agent')
      return
    }

    const selectedAgentsList = agents.filter(a => selectedAgents.has(a.id))
    const emails = selectedAgentsList.map(a => a.email).join(',')
    
    // Open default email client with all selected emails
    window.location.href = `mailto:${emails}`
  }

  function getInviteStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Active</span>
      case 'invited':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Invited</span>
      case 'pending':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">Pending</span>
    }
  }

  async function handleInviteSelected() {
    if (selectedAgents.size === 0) {
      alert('Please select at least one agent')
      return
    }

    const selectedAgentsList = agents.filter(a => selectedAgents.has(a.id))
    
    // Check if any are already active
    const activeCount = selectedAgentsList.filter(a => a.invite_status === 'active').length
    if (activeCount > 0) {
      if (!confirm(`${activeCount} of the selected agents are already active. Invite the remaining ${selectedAgents.size - activeCount}?`)) {
        return
      }
    }

    const agentNames = selectedAgentsList.map(a => `${a.first_name} ${a.last_name}`).join(', ')
    
    if (!confirm(`Send invite emails to ${selectedAgents.size} agent${selectedAgents.size > 1 ? 's' : ''}?\n\n${agentNames.substring(0, 200)}${agentNames.length > 200 ? '...' : ''}`)) {
      return
    }

    setUpdating(true)

    try {
      const response = await fetch('/api/agents/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentIds: Array.from(selectedAgents) })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Invited ${data.invited} agent${data.invited > 1 ? 's' : ''}!${data.failed > 0 ? `\n\n❌ Failed: ${data.failed}` : ''}`)
        setSelectedAgents(new Set())
        router.refresh()
      } else {
        alert(`Error: ${data.error || 'Failed to send invites'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div>
      {/* Bulk Actions */}
      {selectedAgents.size > 0 && (
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700 rounded-xl flex items-center justify-between">
          <p className="text-white font-medium">
            {selectedAgents.size} agent{selectedAgents.size > 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleInviteSelected}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              {updating ? 'Sending...' : 'Invite Selected'}
            </button>
            <button
              onClick={handleEmailSelected}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Selected
            </button>
            <button
              onClick={handleUpdateLicenseDates}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Calendar className="w-4 h-4" />
              {updating ? 'Updating...' : 'Update License Date'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-6 py-3">
                <input
                  type="checkbox"
                  checked={selectedAgents.size === agents.length && agents.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Email</th>
              <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Core</th>
              <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Elective</th>
              <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Mandatory</th>
              <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">NAR</th>
              <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Expires</th>
              <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Listings</th>
              <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Sales</th>
              <th className="text-center px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Closed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {agents.map((agent) => {
              const isExpiring = agent.daysUntilExpiration !== null && agent.daysUntilExpiration <= 45 && agent.daysUntilExpiration >= 0
              const isExpired = agent.daysUntilExpiration !== null && agent.daysUntilExpiration < 0
              
              return (
                <tr key={agent.id} className="hover:bg-slate-700/40 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAgents.has(agent.id)}
                      onChange={() => toggleAgent(agent.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      href={`/dashboard/agents/${agent.id}`}
                      className="text-white font-medium text-sm hover:text-blue-400 transition-colors"
                    >
                      {agent.last_name}, {agent.first_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300 text-sm">{agent.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getInviteStatusBadge(agent.invite_status)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-slate-300 text-sm font-medium">{agent.ce_hours_core ?? 0}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-slate-300 text-sm font-medium">{agent.ce_hours_other ?? 0}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {agent.mandatory_course_completed ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">YES</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">NO</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(() => {
                      const hasCodeOfEthics = !!agent.nar_code_of_ethics_date
                      const hasFairHousing = !!agent.nar_fair_housing_date
                      
                      if (hasCodeOfEthics && hasFairHousing) {
                        return (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">✓ Both Complete</span>
                            {agent.nar_code_of_ethics_cert_url && (
                              <a href={agent.nar_code_of_ethics_cert_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">View COE</a>
                            )}
                            {agent.nar_fair_housing_cert_url && (
                              <a href={agent.nar_fair_housing_cert_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">View FH</a>
                            )}
                          </div>
                        )
                      } else if (hasCodeOfEthics || hasFairHousing) {
                        return (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">⚠️ Partial</span>
                            {hasCodeOfEthics ? (
                              <>
                                <span className="text-xs text-slate-400">✓ Code of Ethics</span>
                                {agent.nar_code_of_ethics_cert_url && (
                                  <a href={agent.nar_code_of_ethics_cert_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">View</a>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-slate-400">✓ Fair Housing</span>
                                {agent.nar_fair_housing_cert_url && (
                                  <a href={agent.nar_fair_housing_cert_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">View</a>
                                )}
                              </>
                            )}
                          </div>
                        )
                      } else {
                        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400">Not Complete</span>
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    {agent.license_expiration ? (
                      <div className="flex items-center gap-2">
                        {(isExpiring || isExpired) && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                        <div>
                          <p className={`text-sm font-medium ${
                            isExpired ? 'text-red-400' :
                            isExpiring ? 'text-orange-400' :
                            'text-slate-300'
                          }`}>
                            {new Date(agent.license_expiration).toLocaleDateString()}
                          </p>
                          {isExpiring && agent.daysUntilExpiration! > 0 && (
                            <p className="text-xs text-orange-300">{agent.daysUntilExpiration} days</p>
                          )}
                          {isExpired && (
                            <p className="text-xs text-red-300">EXPIRED</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-600 italic text-sm">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-blue-400 font-semibold text-lg">{agent.activeListings}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-yellow-400 font-semibold text-lg">{agent.pendingSales}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-400 font-semibold text-lg">{agent.closedDeals}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

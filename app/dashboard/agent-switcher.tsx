'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircle, ChevronDown } from 'lucide-react'

interface Agent {
  id: string
  first_name: string
  last_name: string
}

export default function AgentSwitcher({ agents, currentRole }: { agents: Agent[], currentRole: string }) {
  const router = useRouter()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('impersonate_agent_id')
    if (stored && stored !== 'null') {
      setSelectedAgentId(stored)
    }
  }, [])

  // Only show for brokers
  if (currentRole !== 'broker') return null

  const handleSelect = (agentId: string | null) => {
    if (agentId) {
      localStorage.setItem('impersonate_agent_id', agentId)
      setSelectedAgentId(agentId)
    } else {
      localStorage.removeItem('impersonate_agent_id')
      setSelectedAgentId(null)
    }
    setIsOpen(false)
    router.refresh()
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          selectedAgentId 
            ? 'bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30' 
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
        }`}
      >
        <UserCircle className="w-4 h-4" />
        <span className="text-sm font-medium">
          {selectedAgentId ? `Viewing as: ${selectedAgent?.first_name} ${selectedAgent?.last_name}` : 'Broker View'}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase">Work As</p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {/* Broker option */}
              <button
                onClick={() => handleSelect(null)}
                className={`w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors ${
                  !selectedAgentId ? 'bg-slate-700 text-white' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Broker (Full Access)</span>
                </div>
              </button>

              <div className="border-t border-slate-700 my-1" />

              {/* Agent options */}
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleSelect(agent.id)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors ${
                    selectedAgentId === agent.id ? 'bg-orange-500/20 text-orange-400' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    <span>{agent.first_name} {agent.last_name}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedAgentId && (
              <div className="px-3 py-2 bg-slate-900 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  💡 Testing agent view - you'll only see this agent's data
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

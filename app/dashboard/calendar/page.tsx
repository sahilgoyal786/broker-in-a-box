'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Calendar as CalendarIcon, Filter } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

type DeadlineEvent = {
  id: string
  title: string
  start: Date
  end: Date
  type: 'seller_disclosure' | 'due_diligence' | 'financing' | 'settlement' | 'custom' | 'license' | 'ce'
  transactionId?: string
  agentId?: string
  agentName?: string
}

type DeadlineType = 'seller_disclosure' | 'due_diligence' | 'financing' | 'settlement' | 'custom' | 'license' | 'ce'

const deadlineTypeLabels: Record<DeadlineType, string> = {
  seller_disclosure: 'Seller Disclosure',
  due_diligence: 'Due Diligence',
  financing: 'Financing & Appraisal',
  settlement: 'Settlement/Closing',
  custom: 'Custom Deadlines',
  license: 'License Expiration',
  ce: 'CE Renewal',
}

const deadlineTypeColors: Record<DeadlineType, string> = {
  seller_disclosure: '#8B5CF6', // purple
  due_diligence: '#3B82F6', // blue
  financing: '#10B981', // green
  settlement: '#EF4444', // red
  custom: '#F59E0B', // orange
  license: '#F59E0B', // yellow
  ce: '#8B5CF6', // purple
}

export default function CalendarPage() {
  const [events, setEvents] = useState<DeadlineEvent[]>([])
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [selectedTypes, setSelectedTypes] = useState<Set<DeadlineType>>(
    new Set(['seller_disclosure', 'due_diligence', 'financing', 'settlement', 'custom', 'license', 'ce'])
  )
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH)
  const [loading, setLoading] = useState(true)

  // Fetch deadlines and agents
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      // Get current user and broker
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: broker } = await supabase
        .from('brokers')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single()

      if (!broker) return

      // Fetch agents
      const { data: agentsData } = await supabase
        .from('agents')
        .select('id, first_name, last_name')
        .eq('broker_id', broker.id)
        .order('last_name')

      if (agentsData) {
        setAgents(agentsData.map(a => ({
          id: a.id,
          name: `${a.first_name} ${a.last_name}`
        })))
      }

      // Fetch transactions with deadlines
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          file_id,
          property_address,
          agent_id,
          seller_disclosure_deadline,
          due_diligence_deadline,
          financing_appraisal_deadline,
          settlement_deadline,
          custom_deadline_1_label,
          custom_deadline_1_date,
          custom_deadline_2_label,
          custom_deadline_2_date,
          agents(id, first_name, last_name)
        `)
        .eq('broker_id', broker.id)
        .in('status', ['pending', 'active'])

      const deadlineEvents: DeadlineEvent[] = []

      // Helper to create proper all-day event date (avoids timezone issues)
      const createAllDayDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00')
        return date
      }

      // Process transaction deadlines
      transactions?.forEach(t => {
        const agentName = t.agents ? `${t.agents.first_name} ${t.agents.last_name}` : 'Unknown'
        const address = t.property_address || t.file_id || 'Unknown'

        if (t.seller_disclosure_deadline) {
          deadlineEvents.push({
            id: `sd-${t.id}`,
            title: `Seller Disclosure: ${address}`,
            start: createAllDayDate(t.seller_disclosure_deadline),
            end: createAllDayDate(t.seller_disclosure_deadline),
            type: 'seller_disclosure',
            transactionId: t.id,
            agentId: t.agent_id,
            agentName,
          })
        }

        if (t.due_diligence_deadline) {
          deadlineEvents.push({
            id: `dd-${t.id}`,
            title: `Due Diligence: ${address}`,
            start: createAllDayDate(t.due_diligence_deadline),
            end: createAllDayDate(t.due_diligence_deadline),
            type: 'due_diligence',
            transactionId: t.id,
            agentId: t.agent_id,
            agentName,
          })
        }

        if (t.financing_appraisal_deadline) {
          deadlineEvents.push({
            id: `fin-${t.id}`,
            title: `Financing & Appraisal: ${address}`,
            start: createAllDayDate(t.financing_appraisal_deadline),
            end: createAllDayDate(t.financing_appraisal_deadline),
            type: 'financing',
            transactionId: t.id,
            agentId: t.agent_id,
            agentName,
          })
        }

        if (t.settlement_deadline) {
          deadlineEvents.push({
            id: `settle-${t.id}`,
            title: `Closing: ${address}`,
            start: createAllDayDate(t.settlement_deadline),
            end: createAllDayDate(t.settlement_deadline),
            type: 'settlement',
            transactionId: t.id,
            agentId: t.agent_id,
            agentName,
          })
        }

        // Custom deadline 1
        if (t.custom_deadline_1_date && t.custom_deadline_1_label) {
          deadlineEvents.push({
            id: `custom1-${t.id}`,
            title: `${t.custom_deadline_1_label}: ${address}`,
            start: createAllDayDate(t.custom_deadline_1_date),
            end: createAllDayDate(t.custom_deadline_1_date),
            type: 'custom',
            transactionId: t.id,
            agentId: t.agent_id,
            agentName,
          })
        }

        // Custom deadline 2
        if (t.custom_deadline_2_date && t.custom_deadline_2_label) {
          deadlineEvents.push({
            id: `custom2-${t.id}`,
            title: `${t.custom_deadline_2_label}: ${address}`,
            start: createAllDayDate(t.custom_deadline_2_date),
            end: createAllDayDate(t.custom_deadline_2_date),
            type: 'custom',
            transactionId: t.id,
            agentId: t.agent_id,
            agentName,
          })
        }
      })

      // Fetch agent license/CE expirations
      const { data: agentsExpiry } = await supabase
        .from('agents')
        .select('id, first_name, last_name, license_expiration, ce_renewal_date')
        .eq('broker_id', broker.id)

      agentsExpiry?.forEach(agent => {
        const agentName = `${agent.first_name} ${agent.last_name}`

        if (agent.license_expiration) {
          deadlineEvents.push({
            id: `lic-${agent.id}`,
            title: `License Exp: ${agentName}`,
            start: createAllDayDate(agent.license_expiration),
            end: createAllDayDate(agent.license_expiration),
            type: 'license',
            agentId: agent.id,
            agentName,
          })
        }

        if (agent.ce_renewal_date) {
          deadlineEvents.push({
            id: `ce-${agent.id}`,
            title: `CE Renewal: ${agentName}`,
            start: createAllDayDate(agent.ce_renewal_date),
            end: createAllDayDate(agent.ce_renewal_date),
            type: 'ce',
            agentId: agent.id,
            agentName,
          })
        }
      })

      setEvents(deadlineEvents)
      setLoading(false)
    }

    fetchData()
  }, [])

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filter by type
      if (!selectedTypes.has(event.type)) return false
      
      // Filter by agent
      if (selectedAgent !== 'all' && event.agentId !== selectedAgent) return false

      return true
    })
  }, [events, selectedAgent, selectedTypes])

  // Toggle deadline type filter
  const toggleType = (type: DeadlineType) => {
    const newSet = new Set(selectedTypes)
    if (newSet.has(type)) {
      newSet.delete(type)
    } else {
      newSet.add(type)
    }
    setSelectedTypes(newSet)
  }

  // Custom event style
  const eventStyleGetter = (event: DeadlineEvent) => {
    return {
      style: {
        backgroundColor: deadlineTypeColors[event.type],
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '13px',
        padding: '2px 5px',
      },
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <CalendarIcon className="w-5 h-5 animate-spin" />
          Loading deadlines...
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deadline Calendar</h1>
        <p className="text-gray-600">View all transaction and compliance deadlines</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Filters</h2>
        </div>

        {/* Agent Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        </div>

        {/* Deadline Type Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Deadline Types</label>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(deadlineTypeLabels) as DeadlineType[]).map(type => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedTypes.has(type)
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedTypes.has(type) ? deadlineTypeColors[type] : undefined,
                }}
              >
                {deadlineTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Active Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredEvents.length} of {events.length} deadlines
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ height: '700px' }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={view}
          onView={setView}
          views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => {
            if (event.transactionId) {
              window.location.href = `/dashboard/transactions/${event.transactionId}`
            } else if (event.agentId) {
              window.location.href = `/dashboard/agents/${event.agentId}`
            }
          }}
          formats={{
            agendaTimeRangeFormat: () => '',
            eventTimeRangeFormat: () => '',
            timeGutterFormat: () => '',
          }}
        />
      </div>
    </div>
  )
}

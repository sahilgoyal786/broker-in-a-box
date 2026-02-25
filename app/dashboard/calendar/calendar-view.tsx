'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  id: string
  file_id: string
  client_first_name: string
  client_last_name: string
  property_address: string
  status: string
  seller_disclosure_deadline?: string
  due_diligence_deadline?: string
  financing_appraisal_deadline?: string
  settlement_deadline?: string
  agents?: {
    first_name: string
    last_name: string
  }
}

interface Deadline {
  date: string
  label: string
  transaction: Transaction
}

const DEADLINE_LABELS: Record<string, { label: string; color: string }> = {
  seller_disclosure_deadline: { label: 'Seller Disclosure', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  due_diligence_deadline: { label: 'Due Diligence', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  financing_appraisal_deadline: { label: 'Financing & Appraisal', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  settlement_deadline: { label: 'Settlement', color: 'bg-green-100 text-green-800 border-green-200' }
}

export default function CalendarView({ transactions }: { transactions: Transaction[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Extract all deadlines into a flat array
  const allDeadlines: Deadline[] = []
  
  transactions.forEach(transaction => {
    Object.entries(DEADLINE_LABELS).forEach(([field, { label }]) => {
      const dateValue = transaction[field as keyof Transaction] as string | undefined
      if (dateValue) {
        allDeadlines.push({
          date: dateValue,
          label,
          transaction
        })
      }
    })
  })

  // Group deadlines by date
  const deadlinesByDate = allDeadlines.reduce((acc, deadline) => {
    if (!acc[deadline.date]) acc[deadline.date] = []
    acc[deadline.date].push(deadline)
    return acc
  }, {} as Record<string, Deadline[]>)

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calendar grid calculation
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Generate calendar days
  const calendarDays: (number | null)[] = []
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Format date as YYYY-MM-DD
  const formatDate = (day: number) => {
    const d = new Date(year, month, day)
    return d.toISOString().split('T')[0]
  }

  const today = new Date().toISOString().split('T')[0]

  // Get deadlines for a specific date
  const getDeadlinesForDate = (dateStr: string) => {
    return deadlinesByDate[dateStr] || []
  }

  // Selected date deadlines
  const selectedDeadlines = selectedDate ? getDeadlinesForDate(selectedDate) : []

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(DEADLINE_LABELS).map(([field, { label, color }]) => (
            <div key={field} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${color}`} />
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const dateStr = formatDate(day)
            const deadlines = getDeadlinesForDate(dateStr)
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const hasDeadlines = deadlines.length > 0

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`aspect-square p-2 rounded-lg border transition-all text-left relative ${
                  isToday 
                    ? 'border-blue-500 bg-blue-50' 
                    : isSelected
                    ? 'border-blue-400 bg-blue-50'
                    : hasDeadlines
                    ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className={`text-sm font-medium ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day}
                </div>
                
                {/* Deadline indicators */}
                {hasDeadlines && (
                  <div className="mt-1 space-y-0.5">
                    {deadlines.slice(0, 3).map((deadline, idx) => {
                      const deadlineType = Object.keys(DEADLINE_LABELS).find(
                        key => DEADLINE_LABELS[key].label === deadline.label
                      )
                      const color = deadlineType ? DEADLINE_LABELS[deadlineType].color : ''
                      
                      return (
                        <div
                          key={idx}
                          className={`text-xs px-1 py-0.5 rounded truncate ${color}`}
                        >
                          {deadline.transaction.file_id}
                        </div>
                      )
                    })}
                    {deadlines.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{deadlines.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedDeadlines.length > 0 && (
        <div className="border-t border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Deadlines for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          
          <div className="space-y-3">
            {selectedDeadlines.map((deadline, idx) => {
              const deadlineType = Object.keys(DEADLINE_LABELS).find(
                key => DEADLINE_LABELS[key].label === deadline.label
              )
              const color = deadlineType ? DEADLINE_LABELS[deadlineType].color : ''
              
              return (
                <Link
                  key={idx}
                  href={`/dashboard/transactions/${deadline.transaction.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded border ${color}`}>
                          {deadline.label}
                        </span>
                        <span className="text-sm font-mono text-gray-600">
                          {deadline.transaction.file_id}
                        </span>
                      </div>
                      
                      <p className="font-medium text-gray-900">
                        {deadline.transaction.client_first_name} {deadline.transaction.client_last_name}
                      </p>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {deadline.transaction.property_address || 'No address'}
                      </p>
                      
                      {deadline.transaction.agents && (
                        <p className="text-sm text-gray-500 mt-1">
                          Agent: {deadline.transaction.agents.first_name} {deadline.transaction.agents.last_name}
                        </p>
                      )}
                    </div>
                    
                    <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

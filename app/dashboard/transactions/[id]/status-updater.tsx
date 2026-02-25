'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

export default function StatusUpdater({ 
  transactionId, 
  currentStatus, 
  userRole 
}: { 
  transactionId: string
  currentStatus: string
  userRole: 'broker' | 'agent'
}) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)

  async function updateStatus(newStatus: string, confirmMessage: string) {
    if (!confirm(confirmMessage)) return
    
    setUpdating(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', transactionId) as any

    if (error) {
      alert('Error updating status: ' + error.message)
      setUpdating(false)
      return
    }

    // If closing or cancelling, delete calendar events
    if (newStatus === 'closed' || newStatus === 'cancelled') {
      try {
        await fetch('/api/transactions/delete-calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId })
        })
      } catch (err) {
        console.error('Failed to delete calendar events:', err)
        // Don't block the user - calendar deletion failure is not critical
      }
    }

    router.refresh()
    setUpdating(false)
  }

  // Agent-level actions (submit for office approval with docs)
  const agentButtons = [
    { 
      status: 'pending_closure', 
      label: 'Submit for CTP', 
      icon: CheckCircle, 
      color: 'bg-green-600 hover:bg-green-500',
      confirm: 'Submit for Clear to Pay? Make sure closing documents are uploaded (settlement statement, deed, etc.)',
      show: ['under_contract', 'pending']
    },
    { 
      status: 'pending_cancellation', 
      label: 'Submit for Cancellation', 
      icon: XCircle, 
      color: 'bg-orange-600 hover:bg-orange-500',
      confirm: 'Submit for cancellation? Make sure cancellation agreement is uploaded (signed by all parties)',
      show: ['under_contract', 'pending']
    },
  ]

  // Broker/Office-level actions (review docs and approve)
  const officeButtons = [
    { 
      status: 'closed', 
      label: 'Approve - Mark Closed', 
      icon: CheckCircle, 
      color: 'bg-green-600 hover:bg-green-500',
      confirm: 'FINALIZE CLOSURE? Verify all closing documents are complete. This deal will be marked as closed and funded.',
      show: ['pending_closure']
    },
    { 
      status: 'cancelled', 
      label: 'Approve - Mark Cancelled', 
      icon: XCircle, 
      color: 'bg-red-600 hover:bg-red-500',
      confirm: 'FINALIZE CANCELLATION? Verify cancellation agreement is signed. Listing will return to active inventory.',
      show: ['pending_cancellation']
    },
    { 
      status: 'under_contract', 
      label: 'Reject - Return to Pending', 
      icon: AlertTriangle, 
      color: 'bg-slate-600 hover:bg-slate-500',
      confirm: 'Reject this submission? Transaction will return to under contract status.',
      show: ['pending_closure', 'pending_cancellation']
    },
  ]

  // Filter buttons based on role
  const allButtons = userRole === 'broker' 
    ? [...agentButtons, ...officeButtons]  // Brokers see everything
    : agentButtons  // Agents only see submit buttons
    
  const availableButtons = allButtons.filter(btn => 
    btn.show.includes(currentStatus) && btn.status !== currentStatus
  )

  return (
    <div className="space-y-3">
      {/* Current status badge */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm">Status:</span>
        <span className="text-white font-medium">
          {currentStatus === 'pending_closure' && '⏳ Submitted for CTP - Office Review'}
          {currentStatus === 'pending_cancellation' && '⏳ Submitted for Cancellation - Office Review'}
          {(currentStatus === 'pending' || currentStatus === 'under_contract') && '📋 Under Contract (Pending Sale)'}
          {currentStatus === 'closed' && '✅ Closed & Funded'}
          {currentStatus === 'cancelled' && '❌ Cancelled'}
        </span>
      </div>

      {/* Action buttons */}
      {availableButtons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableButtons.map(({ status, label, icon: Icon, color, confirm }) => (
            <button
              key={status}
              onClick={() => updateStatus(status, confirm)}
              disabled={updating}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors ${color} ${
                updating ? 'opacity-50' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {(currentStatus === 'pending' || currentStatus === 'under_contract') && (
        <div className="text-slate-400 text-sm space-y-1">
          <p>📄 <strong>To close:</strong> Upload closing documents (settlement statement, deed) → Submit for CTP</p>
          <p>❌ <strong>To cancel:</strong> Upload cancellation agreement (signed) → Submit for Cancellation</p>
        </div>
      )}
      {currentStatus === 'pending_closure' && (
        <p className="text-yellow-400 text-sm">⏳ Office is reviewing closing documents. Agent will be notified when approved.</p>
      )}
      {currentStatus === 'pending_cancellation' && (
        <p className="text-orange-400 text-sm">⏳ Office is reviewing cancellation documents. Agent will be notified when approved.</p>
      )}
      {currentStatus === 'closed' && (
        <p className="text-green-400 text-sm">✅ This transaction is closed and funded.</p>
      )}
      {currentStatus === 'cancelled' && (
        <p className="text-red-400 text-sm">❌ This transaction has been cancelled. {/* If listing, it returned to active inventory */}</p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserX, UserCheck } from 'lucide-react'

export default function DeactivateButton({ 
  agentId, 
  agentName,
  isActive 
}: { 
  agentId: string
  agentName: string
  isActive: boolean
}) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)

  async function handleToggle() {
    const action = isActive ? 'deactivate' : 'reactivate'
    const message = isActive 
      ? `Deactivate ${agentName}?\n\nThey will no longer appear in the active agents list, but all transaction history will be preserved.`
      : `Reactivate ${agentName}?\n\nThey will be restored to the active agents list.`
    
    if (!confirm(message)) return

    setUpdating(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('agents')
      .update({ active: !isActive })
      .eq('id', agentId) as any

    if (error) {
      alert(`Error ${action}ing agent: ` + error.message)
      setUpdating(false)
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={updating}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-colors ${
        isActive 
          ? 'bg-red-600 hover:bg-red-500' 
          : 'bg-green-600 hover:bg-green-500'
      }`}
    >
      {isActive ? (
        <>
          <UserX className="w-4 h-4" />
          {updating ? 'Deactivating...' : 'Deactivate Agent'}
        </>
      ) : (
        <>
          <UserCheck className="w-4 h-4" />
          {updating ? 'Reactivating...' : 'Reactivate Agent'}
        </>
      )}
    </button>
  )
}

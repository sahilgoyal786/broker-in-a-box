'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'

export default function RenewLicenseButton({ 
  agentId, 
  currentExpiration 
}: { 
  agentId: string
  currentExpiration: string 
}) {
  const router = useRouter()
  const [renewing, setRenewing] = useState(false)

  async function handleRenew() {
    const currentDate = new Date(currentExpiration)
    const newDate = new Date(currentDate)
    newDate.setFullYear(newDate.getFullYear() + 2)
    
    const confirmMessage = `Renew license to ${newDate.toLocaleDateString()}?\n\nThis will add 2 years to the current expiration date.`
    
    if (!confirm(confirmMessage)) return

    setRenewing(true)
    const supabase = createClient()

    // Add 2 years to current expiration
    const { error } = await supabase
      .from('agents')
      .update({ 
        license_expiration: newDate.toISOString().split('T')[0]
      })
      .eq('id', agentId) as any

    if (error) {
      alert('Error renewing license: ' + error.message)
      setRenewing(false)
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleRenew}
      disabled={renewing}
      className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded disabled:opacity-50 transition-colors"
    >
      {renewing ? '...' : 'Renew'}
    </button>
  )
}

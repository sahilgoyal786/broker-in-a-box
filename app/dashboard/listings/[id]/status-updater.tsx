'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  listingId: string
  currentStatus: string
}

export default function StatusUpdater({ listingId, currentStatus }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('listings')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', listingId)

    if (error) {
      alert('Failed to update status: ' + error.message)
      setLoading(false)
      return
    }

    setStatus(newStatus)
    setLoading(false)
    router.refresh()
  }

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'closed', label: 'Closed', color: 'bg-blue-100 text-blue-800' },
    { value: 'expired', label: 'Expired', color: 'bg-gray-100 text-gray-800' },
    { value: 'withdrawn', label: 'Withdrawn', color: 'bg-orange-100 text-orange-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ]

  const currentOption = statusOptions.find(opt => opt.value === status)

  return (
    <div className="relative">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border-none ${currentOption?.color} disabled:opacity-50`}
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

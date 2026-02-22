'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InitializeComplianceButton({ agencyId }: { agencyId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function initialize() {
    setLoading(true)
    
    const res = await fetch(`/api/agencies/${agencyId}/initialize-compliance`, {
      method: 'POST'
    })

    const data = await res.json()

    if (data.success) {
      alert(`✅ Created ${data.itemsCreated} compliance items!`)
      router.refresh()
    } else if (data.exists) {
      alert('Compliance checklist already exists')
    } else {
      alert('Error: ' + (data.error || 'Unknown error'))
    }

    setLoading(false)
  }

  return (
    <button
      onClick={initialize}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Creating...' : 'Initialize Compliance Checklist'}
    </button>
  )
}

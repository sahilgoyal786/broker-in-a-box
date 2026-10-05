'use client'

import { useState } from 'react'
import NotificationPreference from './notification-preference'

export default function OnboardingFlow({ initialAddress }: { initialAddress: string | null }) {
  const [address, setAddress] = useState<string | null>(initialAddress)
  const [confirmed, setConfirmed] = useState(false)
  const [brokerageName, setBrokerageName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (address && confirmed) return <NotificationPreference />

  const handleCreate = async () => {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/onboarding/provision-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brokerageName }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }
    setAddress(data.address)
  }

  const handleCopy = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Broker in a Box!</h1>

        {!address ? (
          <>
            <p className="text-gray-400 mb-8">
              We'll create a dedicated email address for your brokerage. Forward your transaction emails there and we'll handle the rest.
            </p>
            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="brokerage-name">
              Brokerage name
            </label>
            <input
              id="brokerage-name"
              value={brokerageName}
              onChange={(e) => setBrokerageName(e.target.value)}
              placeholder="Acme Realty LLC"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mb-4 border border-gray-600 focus:border-blue-500 outline-none"
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={saving || brokerageName.trim().length < 2}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {saving ? 'Creating...' : 'Create my address'}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-400 mb-6">Your brokerage's forwarding address:</p>
            <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
              <span className="flex-1 font-mono text-blue-400 break-all">{address}</span>
              <button
                onClick={handleCopy}
                className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-8">
              Set up auto-forwarding in your email provider (or CC this address on e-sign emails). You can find these instructions again in Settings.
            </p>
            <button
              onClick={() => setConfirmed(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  )
}

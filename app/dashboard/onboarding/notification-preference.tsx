'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NotificationPreference() {
  const [preference, setPreference] = useState('exception_based')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update broker preference
    const { error } = await supabase
      .from('brokers')
      .update({ notification_preference: preference })
      .eq('auth_user_id', user.id)

    if (error) {
      console.error('Error saving preference:', error)
      setSaving(false)
      return
    }

    // Redirect to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to Broker in a Box!
        </h1>
        <p className="text-gray-400 mb-8">
          Let's customize how you want to stay informed about your team's activity.
        </p>

        <h2 className="text-xl font-semibold text-white mb-4">
          How do you want to be notified?
        </h2>

        <div className="space-y-4 mb-8">
          {/* Real-Time */}
          <label className="flex items-start gap-4 p-4 border-2 border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="radio"
              name="preference"
              value="real_time"
              checked={preference === 'real_time'}
              onChange={(e) => setPreference(e.target.value)}
              className="mt-1"
            />
            <div>
              <div className="font-semibold text-white">Real-Time Email Alerts</div>
              <div className="text-sm text-gray-400">
                Get notified immediately when agents create or update transactions. Most oversight.
              </div>
            </div>
          </label>

          {/* Daily Digest */}
          <label className="flex items-start gap-4 p-4 border-2 border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="radio"
              name="preference"
              value="daily_digest"
              checked={preference === 'daily_digest'}
              onChange={(e) => setPreference(e.target.value)}
              className="mt-1"
            />
            <div>
              <div className="font-semibold text-white">Daily Digest Email</div>
              <div className="text-sm text-gray-400">
                One email per day summarizing all activity. Balanced approach.
              </div>
            </div>
          </label>

          {/* Exception-Based (Recommended) */}
          <label className="flex items-start gap-4 p-4 border-2 border-blue-500 rounded-lg cursor-pointer bg-blue-500/10">
            <input
              type="radio"
              name="preference"
              value="exception_based"
              checked={preference === 'exception_based'}
              onChange={(e) => setPreference(e.target.value)}
              className="mt-1"
            />
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                Exception-Based Alerts
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                  Recommended
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Only get notified about compliance issues: missing docs, license expirations, stuck transactions.
              </div>
            </div>
          </label>

          {/* Dashboard Only */}
          <label className="flex items-start gap-4 p-4 border-2 border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="radio"
              name="preference"
              value="dashboard_only"
              checked={preference === 'dashboard_only'}
              onChange={(e) => setPreference(e.target.value)}
              className="mt-1"
            />
            <div>
              <div className="font-semibold text-white">Dashboard Only</div>
              <div className="text-sm text-gray-400">
                No emails - just log in when you want to check. Hands-off approach.
              </div>
            </div>
          </label>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          💡 You can change this anytime in Settings
        </p>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Continue to Dashboard'}
        </button>
      </div>
    </div>
  )
}

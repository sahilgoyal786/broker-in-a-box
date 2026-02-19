'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Broker } from '@/types/database'

interface Props {
  broker: Pick<Broker, 'id' | 'name' | 'email' | 'gmail_transactions_email' | 'gmail_refresh_token'>
}

export default function SettingsForm({ broker }: Props) {
  const supabase = createClient()

  const [brokerName, setBrokerName] = useState(broker.name)
  const [gmailEmail, setGmailEmail] = useState(broker.gmail_transactions_email ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingGmail, setSavingGmail] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [gmailMsg, setGmailMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const inputClass =
    'w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
  const labelClass = 'block text-slate-400 text-sm mb-1.5'

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)

    const { error } = await supabase
      .from('brokers')
      .update({ name: brokerName } as any)
      .eq('id', broker.id)

    setSavingProfile(false)
    setProfileMsg(error
      ? { type: 'err', text: error.message }
      : { type: 'ok', text: 'Profile saved.' }
    )
  }

  async function saveGmail(e: React.FormEvent) {
    e.preventDefault()
    setSavingGmail(true)
    setGmailMsg(null)

    const { error } = await supabase
      .from('brokers')
      .update({ gmail_transactions_email: gmailEmail || null } as any)
      .eq('id', broker.id)

    setSavingGmail(false)
    setGmailMsg(error
      ? { type: 'err', text: error.message }
      : { type: 'ok', text: 'Gmail address saved.' }
    )
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Profile */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Profile</h2>
          <p className="text-slate-400 text-sm mt-0.5">Your brokerage information</p>
        </div>
        <form onSubmit={saveProfile} className="p-6 space-y-5">
          <div>
            <label className={labelClass}>Broker / Brokerage Name</label>
            <input
              type="text"
              required
              value={brokerName}
              onChange={e => setBrokerName(e.target.value)}
              placeholder="Your brokerage name"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              readOnly
              value={broker.email}
              className={`${inputClass} opacity-60 cursor-not-allowed`}
            />
            <p className="text-slate-600 text-xs mt-1.5">Email is set by your Google account and cannot be changed here.</p>
          </div>

          {profileMsg && (
            <div className={`p-3 rounded-lg text-sm ${profileMsg.type === 'ok' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Section 2: Gmail Integration */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Gmail Integration</h2>
          <p className="text-slate-400 text-sm mt-0.5">Configure inbound document processing</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Connection status */}
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${broker.gmail_refresh_token ? 'bg-green-400' : 'bg-slate-600'}`} />
            <span className={`text-sm font-medium ${broker.gmail_refresh_token ? 'text-green-400' : 'text-slate-400'}`}>
              {broker.gmail_refresh_token ? 'Gmail Connected' : 'Not connected'}
            </span>
            {!broker.gmail_refresh_token && (
              <button
                onClick={() => window.location.href = '/api/auth/google-gmail'}
                className="ml-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Connect Gmail
              </button>
            )}
          </div>

          <form onSubmit={saveGmail} className="space-y-4">
            <div>
              <label className={labelClass}>Transaction Gmail Address</label>
              <input
                type="email"
                value={gmailEmail}
                onChange={e => setGmailEmail(e.target.value)}
                placeholder="transactions@yourteam.com"
                className={inputClass}
              />
            </div>

            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm leading-relaxed">
                Create a dedicated Gmail account for transactions. Agents CC this address on all DocuSign emails.
                We&apos;ll monitor it for compliance documents.
              </p>
            </div>

            {gmailMsg && (
              <div className={`p-3 rounded-lg text-sm ${gmailMsg.type === 'ok' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                {gmailMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={savingGmail}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {savingGmail ? 'Saving…' : 'Save Gmail Address'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

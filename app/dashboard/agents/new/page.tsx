'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewAgentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    license_number: '',
  })

  const inputClass =
    'w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
  const labelClass = 'block text-slate-400 text-sm mb-1.5'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Get broker ID from current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single() as any

    if (brokerError || !broker) {
      setError('Could not find broker account')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('agents')
      .insert({
        broker_id: broker.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        license_number: form.license_number || null,
      } as any)

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    router.push('/dashboard/agents')
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <Link
          href="/dashboard/agents"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Back to Agents
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">Add Agent</h1>
        <p className="text-slate-400 mt-1">Add an agent to your roster.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                placeholder="Jane"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                placeholder="Smith"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jane.smith@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              License Number <span className="text-slate-600">(optional)</span>
            </label>
            <input
              type="text"
              value={form.license_number}
              onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))}
              placeholder="e.g. 12345678-SA00"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {loading ? 'Adding…' : 'Add Agent'}
          </button>
          <Link
            href="/dashboard/agents"
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

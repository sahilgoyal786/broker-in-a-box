'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PropertyType, TransactionType, TransactionStatus } from '@/types/database'
import Link from 'next/link'

interface Agent {
  id: string
  first_name: string
  last_name: string
}

interface Props {
  brokerId: string
  agents: Agent[]
}

export default function NewTransactionForm({ brokerId, agents }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    client_first_name: '',
    client_last_name: '',
    property_address: '',
    property_type: 'residential' as PropertyType,
    transaction_type: 'buyer_agency' as TransactionType,
    agent_id: '',
    status: 'active' as TransactionStatus,
  })

  const inputClass =
    'w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
  const labelClass = 'block text-slate-400 text-sm mb-1.5'
  const selectClass =
    'w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert({
        broker_id: brokerId,
        agent_id: form.agent_id || null,
        client_first_name: form.client_first_name,
        client_last_name: form.client_last_name,
        property_address: form.property_address || null,
        property_type: form.property_type,
        transaction_type: form.transaction_type,
        status: form.status,
      } as any)
      .select('id')
      .single()

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    router.push(`/dashboard/transactions/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-6">

        {/* Client name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client First Name *</label>
            <input
              type="text"
              required
              value={form.client_first_name}
              onChange={e => setForm(f => ({ ...f, client_first_name: e.target.value }))}
              placeholder="Jane"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Client Last Name *</label>
            <input
              type="text"
              required
              value={form.client_last_name}
              onChange={e => setForm(f => ({ ...f, client_last_name: e.target.value }))}
              placeholder="Smith"
              className={inputClass}
            />
          </div>
        </div>

        {/* Property address */}
        <div>
          <label className={labelClass}>Property Address <span className="text-slate-600">(optional)</span></label>
          <input
            type="text"
            value={form.property_address}
            onChange={e => setForm(f => ({ ...f, property_address: e.target.value }))}
            placeholder="123 Main St, Salt Lake City, UT 84101"
            className={inputClass}
          />
          <p className="text-slate-600 text-xs mt-1.5">Leave blank for buyer representation where address isn&apos;t set yet.</p>
        </div>

        {/* Property type */}
        <div>
          <label className={labelClass}>Property Type *</label>
          <select
            required
            value={form.property_type}
            onChange={e => setForm(f => ({ ...f, property_type: e.target.value as PropertyType }))}
            className={selectClass}
          >
            <option value="residential">Residential</option>
            <option value="vacant_land">Vacant Land</option>
            <option value="mobile_home">Mobile Home</option>
            <option value="commercial">Commercial</option>
            <option value="multi_unit">Multi-Unit</option>
            <option value="farm">Farm</option>
            <option value="residential_lease">Residential Lease</option>
          </select>
        </div>

        {/* Transaction type */}
        <div>
          <label className={labelClass}>Transaction Type *</label>
          <select
            required
            value={form.transaction_type}
            onChange={e => setForm(f => ({ ...f, transaction_type: e.target.value as TransactionType }))}
            className={selectClass}
          >
            <option value="listing">Listing</option>
            <option value="buyer_agency">Buyer Agency</option>
            <option value="seller_purchase">Seller / Purchase</option>
            <option value="buyer_purchase">Buyer / Purchase</option>
            <option value="unrepresented_buyer">Unrepresented Buyer</option>
            <option value="fsbo_purchase">FSBO Purchase</option>
          </select>
        </div>

        {/* Agent */}
        <div>
          <label className={labelClass}>Agent <span className="text-slate-600">(optional)</span></label>
          <select
            value={form.agent_id}
            onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
            className={selectClass}
          >
            <option value="">— Unassigned —</option>
            {agents.map((agent: any) => (
              <option key={agent.id} value={agent.id}>
                {agent.last_name}, {agent.first_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className={labelClass}>Status *</label>
          <select
            required
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as TransactionStatus }))}
            className={selectClass}
          >
            <option value="active">Active</option>
            <option value="under_contract">Under Contract</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
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
          {loading ? 'Creating…' : 'Create Transaction'}
        </button>
        <Link
          href="/dashboard/transactions"
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}

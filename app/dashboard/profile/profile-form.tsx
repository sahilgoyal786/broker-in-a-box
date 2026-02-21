'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, Save, X } from 'lucide-react'

export default function ProfileForm({ agentId, currentPhone }: { agentId: string, currentPhone: string }) {
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(currentPhone)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    setSaving(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('agents')
        .update({ phone })
        .eq('id', agentId)

      if (error) throw error

      setMessage('Phone number updated successfully')
      setEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setPhone(currentPhone)
    setEditing(false)
    setMessage('')
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
      
      {editing ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(555) 123-4567"
              disabled={saving}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
          {message && (
            <p className={`text-sm ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            {phone || 'Not set'}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Edit
          </button>
        </div>
      )}
      
      {!editing && message && (
        <p className={`text-sm mt-2 ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
      
      {!editing && (
        <p className="text-xs text-slate-500 mt-1">You can update your phone number anytime</p>
      )}
    </div>
  )
}

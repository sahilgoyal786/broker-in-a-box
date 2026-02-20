'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'

export default function UploadAgentsForm({ brokerId }: { brokerId: string }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: number; skipped: number; errors: string[] } | null>(null)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('csv') as File
    
    if (!file) {
      alert('Please select a CSV file')
      setUploading(false)
      return
    }

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV file must have a header row and at least one agent')
        setUploading(false)
        return
      }

      // Parse CSV
      const header = lines[0].split(',').map(h => h.trim())
      const rows = lines.slice(1)

      const agents = rows.map(line => {
        const values = line.split(',').map(v => v.trim())
        return {
          first_name: values[0],
          middle_initial: values[1] || null,
          last_name: values[2],
          email: values[3],
          phone: values[4] || null,
          date_of_birth: values[5] || null,
          gender: values[6] || null,
          address: values[7] || null,
          city: values[8] || null,
          state: values[9] || 'UT',
          zip: values[10] || null,
          payment_method: values[11] || null,
          entity_name: values[12] || null,
          ssn_last_4: values[13] || null,
          ein: values[14] || null,
          primary_board: values[15] || null,
          license_number: values[16] || null,
          license_expiration: values[17] || null,
          original_license_date: values[18] || null,
          current_company: values[19] || null,
          listings_at_hire: values[20] ? parseInt(values[20]) : 0,
          hire_date: values[21] || null,
        }
      }).filter(a => a.first_name && a.last_name && a.email)

      if (agents.length === 0) {
        alert('No valid agents found in CSV')
        setUploading(false)
        return
      }

      // Upload agents
      const supabase = createClient()
      let success = 0
      let skipped = 0
      const errors: string[] = []

      for (const agent of agents) {
        // Check if email already exists
        const { data: existing } = await supabase
          .from('agents')
          .select('id')
          .eq('broker_id', brokerId)
          .eq('email', agent.email)
          .single() as any

        if (existing) {
          skipped++
          continue
        }

        // Create agent
        const { error } = await supabase
          .from('agents')
          .insert({
            broker_id: brokerId,
            ...agent
          }) as any

        if (error) {
          errors.push(`${agent.email}: ${error.message}`)
        } else {
          success++
          
          // TODO: Send invite email (we'll add this next)
        }
      }

      setResult({ success, skipped, errors })
      
      if (success > 0) {
        setTimeout(() => router.push('/dashboard/agents'), 2000)
      }
    } catch (error: any) {
      alert('Error parsing CSV: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleUpload} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="mb-4">
          <label className="block text-slate-400 text-sm mb-2">Select CSV File</label>
          <input
            type="file"
            name="csv"
            accept=".csv"
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-500
              cursor-pointer"
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Agents'}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-white font-semibold mb-4">Upload Results</h3>
          
          {result.success > 0 && (
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span>{result.success} agent{result.success !== 1 ? 's' : ''} added successfully</span>
            </div>
          )}
          
          {result.skipped > 0 && (
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span>{result.skipped} duplicate{result.skipped !== 1 ? 's' : ''} skipped (already exists)</span>
            </div>
          )}
          
          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-red-400 mb-2">Errors:</p>
              <ul className="text-sm text-slate-400 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {result.success > 0 && (
            <p className="text-slate-500 text-sm mt-4">
              Redirecting to agents page...
            </p>
          )}
        </div>
      )}
    </div>
  )
}

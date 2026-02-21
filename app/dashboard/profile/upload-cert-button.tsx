'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'

interface UploadCertButtonProps {
  agentId: string
  certType: 'code_of_ethics' | 'fair_housing'
  currentUrl?: string | null
  onSuccess: () => void
}

export default function UploadCertButton({ agentId, certType, currentUrl, onSuccess }: UploadCertButtonProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const label = certType === 'code_of_ethics' ? 'Code of Ethics' : 'Fair Housing'

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPG, PNG)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()

      // Create storage path: agents/{agentId}/nar_{type}_{timestamp}.ext
      const timestamp = Date.now()
      const ext = file.name.split('.').pop()
      const fileName = `nar_${certType}_${timestamp}.${ext}`
      const filePath = `agents/${agentId}/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath)

      // Update agent record
      const updateData: any = {
        [`nar_${certType}_cert_url`]: publicUrl,
        [`nar_${certType}_date`]: new Date().toISOString().split('T')[0] // Today's date
      }

      const { error: updateError } = await supabase
        .from('agents')
        .update(updateData)
        .eq('id', agentId)

      if (updateError) throw updateError

      setSuccess('Uploaded successfully!')
      setTimeout(() => {
        setSuccess('')
        onSuccess()
      }, 2000)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {currentUrl ? (
        <div className="flex items-center gap-2">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            View Proof
          </a>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Re-upload'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Proof'}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-400 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          {success}
        </p>
      )}

      <p className="text-xs text-slate-500">
        Upload certificate, email, or screenshot (PDF, JPG, PNG - max 5MB)
      </p>
    </div>
  )
}

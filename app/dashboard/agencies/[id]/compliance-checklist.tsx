'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ComplianceItem {
  id: string
  form_name: string
  tracking_type: string
  is_required: boolean
  is_complete: boolean
  completed_at: string | null
}

export default function ComplianceChecklist({ 
  agencyId, 
  items, 
  canEdit 
}: { 
  agencyId: string
  items: ComplianceItem[]
  canEdit: boolean 
}) {
  const [checklist, setChecklist] = useState<ComplianceItem[]>(items)
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient()

  const completeCount = checklist.filter(item => item.is_complete).length
  const totalCount = checklist.length
  const missingRequired = checklist.filter(item => item.is_required && !item.is_complete).length

  async function toggleItem(itemId: string, currentStatus: boolean) {
    if (!canEdit) return
    
    setUpdating(itemId)

    const { error } = await supabase
      .from('agency_compliance_items')
      .update({
        is_complete: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null
      })
      .eq('id', itemId)

    if (error) {
      alert('Error updating checklist: ' + error.message)
      setUpdating(null)
      return
    }

    // Update local state
    setChecklist(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, is_complete: !currentStatus, completed_at: !currentStatus ? new Date().toISOString() : null }
          : item
      )
    )

    setUpdating(null)
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Agency Compliance Checklist</h2>
        <div className="text-sm">
          <span className="text-white font-semibold">{completeCount} of {totalCount}</span>
          <span className="text-slate-400 ml-1">forms complete</span>
          {missingRequired > 0 && (
            <span className="ml-3 text-red-400 font-semibold">
              {missingRequired} missing 🚨
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {checklist.map(item => (
          <div 
            key={item.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg border
              ${item.is_complete 
                ? 'bg-slate-900/50 border-green-900/30' 
                : item.is_required 
                  ? 'bg-slate-900/50 border-red-900/30'
                  : 'bg-slate-900/50 border-slate-700'
              }
              ${canEdit ? 'cursor-pointer hover:bg-slate-900' : 'cursor-default'}
              ${updating === item.id ? 'opacity-50' : ''}
            `}
            onClick={() => canEdit && toggleItem(item.id, item.is_complete)}
          >
            {/* Checkbox */}
            <div className="flex-shrink-0 mt-0.5">
              {item.is_complete ? (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className={`w-5 h-5 border-2 rounded ${
                  item.is_required ? 'border-red-500' : 'border-slate-500'
                }`} />
              )}
            </div>

            {/* Form name */}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                item.is_complete ? 'text-slate-400 line-through' : 'text-white'
              }`}>
                {item.form_name}
              </p>
              
              {item.is_required && !item.is_complete && (
                <p className="text-xs text-red-400 mt-1">
                  🚨 Required
                </p>
              )}

              {item.is_complete && item.completed_at && (
                <p className="text-xs text-slate-500 mt-1">
                  Completed {new Date(item.completed_at).toLocaleDateString()}
                </p>
              )}

              <p className="text-xs text-slate-500 mt-1">
                {item.tracking_type === 'manual_checkbox' ? 'Manual checkbox' :
                 item.tracking_type === 'pdf_auto' ? 'Auto-detected from email' :
                 item.tracking_type === 'manual_upload' ? 'Manual upload' : item.tracking_type}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!canEdit && (
        <p className="text-xs text-slate-500 mt-4 text-center">
          View only - contact your broker to update compliance status
        </p>
      )}
    </div>
  )
}

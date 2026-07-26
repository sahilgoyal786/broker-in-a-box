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
  agent_provided?: boolean
  agent_provided_at?: string | null
  broker_approval_status?: string
}

export default function TransactionComplianceChecklist({ 
  items, 
  canEdit,
  userRole,
}: { 
  items: ComplianceItem[]
  canEdit: boolean 
  userRole: 'broker' | 'agent'
}) {
  const [checklist, setChecklist] = useState<ComplianceItem[]>(items)
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient()

  const isProvided = (item: ComplianceItem) => item.is_complete || Boolean(item.agent_provided)
  const completeCount = checklist.filter(isProvided).length
  const totalCount = checklist.length
  const missingRequired = checklist.filter(item => item.is_required && !isProvided(item)).length

  async function toggleItem(itemId: string, currentStatus: boolean) {
    if (!canEdit) return
    
    setUpdating(itemId)

    const updateData = userRole === 'broker'
      ? {
          is_complete: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
          broker_approval_status: !currentStatus ? 'approved' : 'pending',
        }
      : {
          agent_provided: !currentStatus,
        }

    const { error } = await supabase
      .from('transaction_compliance_items')
      .update(updateData)
      .eq('id', itemId)

    if (error) {
      alert('Error updating checklist: ' + error.message)
      setUpdating(null)
      return
    }

    // Update local state
    setChecklist(prev => 
      prev.map(item => 
        item.id === itemId && userRole === 'broker'
          ? {
              ...item,
              is_complete: !currentStatus,
              completed_at: !currentStatus ? new Date().toISOString() : null,
              broker_approval_status: !currentStatus ? 'approved' : 'pending',
            }
          : item.id === itemId
            ? {
                ...item,
                agent_provided: !currentStatus,
                agent_provided_at: !currentStatus ? new Date().toISOString() : null,
              }
          : item
      )
    )

    setUpdating(null)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Transaction Compliance Checklist</h2>
        <div className="text-sm mt-1">
          <span className="text-gray-900 font-semibold">{completeCount} of {totalCount}</span>
          <span className="text-gray-600 ml-1">forms complete</span>
          {missingRequired > 0 && (
            <span className="ml-3 text-red-600 font-semibold">
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
              ${isProvided(item)
                ? 'bg-green-50 border-green-200' 
                : item.is_required 
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }
              ${canEdit ? 'cursor-pointer hover:bg-opacity-80' : 'cursor-default'}
              ${updating === item.id ? 'opacity-50' : ''}
            `}
            onClick={() => canEdit && toggleItem(item.id, userRole === 'broker' ? item.is_complete : Boolean(item.agent_provided))}
          >
            {/* Checkbox */}
            <div className="flex-shrink-0 mt-0.5">
              {isProvided(item) ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className={`w-5 h-5 border-2 rounded ${
                  item.is_required ? 'border-red-500' : 'border-gray-400'
                }`} />
              )}
            </div>

            {/* Form name */}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isProvided(item) ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}>
                {item.form_name}
              </p>
              
              {item.is_required && !isProvided(item) && (
                <p className="text-xs text-red-600 mt-1">
                  🚨 Required
                </p>
              )}

              {item.is_complete && item.completed_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Broker approved {new Date(item.completed_at).toLocaleDateString()}
                </p>
              )}

              {!item.is_complete && item.agent_provided && item.agent_provided_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Provided by agent {new Date(item.agent_provided_at).toLocaleDateString()}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-1">
                {item.tracking_type === 'manual_checkbox' ? 'Manual checkbox' :
                 item.tracking_type === 'pdf_auto' ? 'Auto-detected from email' :
                 item.tracking_type === 'manual_upload' ? 'Manual upload' : item.tracking_type}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!canEdit && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          View only - contact your broker to update compliance status
        </p>
      )}
    </div>
  )
}

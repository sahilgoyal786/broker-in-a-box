'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import UploadCertButton from './upload-cert-button'

interface NARComplianceSectionProps {
  agentId: string
  codeOfEthicsDate: string | null
  codeOfEthicsCertUrl: string | null
  fairHousingDate: string | null
  fairHousingCertUrl: string | null
  cycleEnd: string | null
}

export default function NARComplianceSection({
  agentId,
  codeOfEthicsDate,
  codeOfEthicsCertUrl,
  fairHousingDate,
  fairHousingCertUrl,
  cycleEnd
}: NARComplianceSectionProps) {
  const router = useRouter()

  function handleUploadSuccess() {
    // Refresh the page to show updated data
    router.refresh()
  }

  const cycleEndFormatted = cycleEnd 
    ? new Date(cycleEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'December 31, 2027'

  const cycleEndShort = cycleEnd 
    ? new Date(cycleEnd).toLocaleDateString()
    : 'Dec 31, 2027'

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-400" />
          NAR Compliance
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Current Cycle: January 1, 2025 – {cycleEndFormatted}
        </p>
        <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="text-xs text-blue-200">
            <strong>Note:</strong> Your Utah CE hours are tracked automatically with the Division of Real Estate. 
            NAR compliance requires you to upload proof of completion (certificate, email, or screenshot).
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Code of Ethics */}
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Code of Ethics</h3>
            <span className={`px-3 py-1 text-xs rounded-lg border ${
              codeOfEthicsDate
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-slate-700 border-slate-600 text-slate-400'
            }`}>
              {codeOfEthicsDate ? '✓ Complete' : 'Not Complete'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-slate-400">Last Completed</p>
              <p className="text-white mt-1">
                {codeOfEthicsDate 
                  ? new Date(codeOfEthicsDate).toLocaleDateString()
                  : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-slate-400">Required By</p>
              <p className="text-white mt-1">{cycleEndShort}</p>
            </div>
          </div>
          <UploadCertButton
            agentId={agentId}
            certType="code_of_ethics"
            currentUrl={codeOfEthicsCertUrl}
            onSuccess={handleUploadSuccess}
          />
        </div>

        {/* Fair Housing Training */}
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Fair Housing Training</h3>
            <span className={`px-3 py-1 text-xs rounded-lg border ${
              fairHousingDate
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-slate-700 border-slate-600 text-slate-400'
            }`}>
              {fairHousingDate ? '✓ Complete' : 'Not Complete'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-slate-400">Last Completed</p>
              <p className="text-white mt-1">
                {fairHousingDate 
                  ? new Date(fairHousingDate).toLocaleDateString()
                  : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-slate-400">Required By</p>
              <p className="text-white mt-1">{cycleEndShort}</p>
            </div>
          </div>
          <UploadCertButton
            agentId={agentId}
            certType="fair_housing"
            currentUrl={fairHousingCertUrl}
            onSuccess={handleUploadSuccess}
          />
        </div>
      </div>

      <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
        <p className="text-sm text-purple-200">
          <strong>NAR Requirements:</strong> Code of Ethics and Fair Housing training must be completed every 3 years. Current cycle ends December 31, 2027.
        </p>
      </div>
    </div>
  )
}

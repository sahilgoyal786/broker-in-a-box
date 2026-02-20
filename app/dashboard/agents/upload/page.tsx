import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/supabase/get-user-role'
import UploadAgentsForm from './upload-form'

export default async function UploadAgentsPage() {
  const userContext = await getUserContext()
  
  // Only brokers can upload agents
  if (!userContext || userContext.role !== 'broker') {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', userContext.userId)
    .single() as any

  if (!broker) redirect('/dashboard')

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">Upload Agents</h1>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">CSV Format</h2>
        <p className="text-slate-400 mb-4">
          Upload a CSV file with the following columns (header row required):
        </p>
        <div className="bg-slate-900 rounded-lg p-4 mb-4 overflow-x-auto">
          <code className="text-xs text-green-400 whitespace-nowrap">
            First,MI,Last,Email,Phone,Date of Birth,Gender,Address,City,State,Zip,Payment Method,Entity Name,SSN Last 4,EIN,Primary Board,License #,License Expiration,Original License Date,Current Company,Listings at Hire,Hire Date
          </code>
        </div>
        <p className="text-slate-400 text-sm mb-2">Example:</p>
        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
          <code className="text-xs text-slate-300 whitespace-nowrap">
            John,A,Smith,john@example.com,801-555-1234,1985-06-15,Male,123 Main St,Salt Lake City,UT,84101,Person,,5678,,Wasatch Front Regional MLS,12345678,2026-05-31,2010-03-15,ABC Realty,3,2024-01-15
          </code>
        </div>
        <p className="text-slate-500 text-sm mt-4">
          • Date format: YYYY-MM-DD (e.g., 2026-05-31)<br/>
          • Payment Method: "Person" or "Entity"<br/>
          • If Person: provide SSN Last 4 (column 14)<br/>
          • If Entity: provide Entity Name (column 13) and EIN (column 15)<br/>
          • Leave fields blank if not applicable<br/>
          • Duplicate emails will be skipped
        </p>
      </div>

      <UploadAgentsForm brokerId={broker.id} />
    </div>
  )
}

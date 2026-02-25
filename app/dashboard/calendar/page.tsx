import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/supabase/get-user-role'
import CalendarView from './calendar-view'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { role, brokerId, agentId } = await getUserContext()

  if (!brokerId) redirect('/auth/login')

  // Fetch all transactions with deadlines (filtered by role)
  let query = supabase
    .from('transactions')
    .select(`
      id,
      file_id,
      client_first_name,
      client_last_name,
      property_address,
      status,
      seller_disclosure_deadline,
      due_diligence_deadline,
      financing_appraisal_deadline,
      settlement_deadline,
      agents(first_name, last_name)
    `)
    .eq('broker_id', brokerId)
    .in('status', ['pending', 'active'])  // Only show active/pending
    .order('settlement_deadline', { ascending: true })

  // Agents see only their own transactions
  if (role === 'agent') {
    query = query.eq('agent_id', agentId)
  }

  const { data: transactions } = await query as any

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Deadline Calendar</h1>
        <p className="text-gray-600 mt-2">
          View all REPC deadlines across your active transactions
        </p>
      </div>

      <CalendarView transactions={transactions || []} />
    </div>
  )
}

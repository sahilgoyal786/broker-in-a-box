import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteTransactionDeadlines } from '@/lib/calendar-sync'

type StatusAction =
  | 'submit_clear_to_pay'
  | 'approve_clear_to_pay'
  | 'return_clear_to_pay'
  | 'submit_cancellation'
  | 'approve_cancellation'
  | 'return_cancellation'

type TransactionStatusRow = {
  id: string
  broker_id: string
  agent_id: string | null
  status: string
}

const openStatuses = new Set(['active', 'pending', 'under_contract'])
const allowedActions = new Set<StatusAction>([
  'submit_clear_to_pay',
  'approve_clear_to_pay',
  'return_clear_to_pay',
  'submit_cancellation',
  'approve_cancellation',
  'return_cancellation',
])

function isStatusAction(action: unknown): action is StatusAction {
  return typeof action === 'string' && allowedActions.has(action as StatusAction)
}

export async function POST(request: NextRequest) {
  try {
    const { transactionId, action } = await request.json() as {
      transactionId?: string
      action?: StatusAction
    }

    if (!transactionId || !action) {
      return NextResponse.json(
        { error: 'Transaction ID and action are required' },
        { status: 400 },
      )
    }

    if (!isStatusAction(action)) {
      return NextResponse.json({ error: 'Invalid transaction status action' }, { status: 400 })
    }

    const userContext = await getUserContext()
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: transaction, error: fetchError } = await admin
      .from('transactions')
      .select('id, broker_id, agent_id, status')
      .eq('id', transactionId)
      .single()

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const transactionRow = transaction as TransactionStatusRow
    const ownsBrokerage = transactionRow.broker_id === userContext.brokerId
    const ownsAgentFile = userContext.role === 'agent' && transactionRow.agent_id === userContext.agentId

    if (!ownsBrokerage || (userContext.role === 'agent' && !ownsAgentFile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let nextStatus: string

    if (action === 'submit_clear_to_pay' || action === 'submit_cancellation') {
      if (!openStatuses.has(transactionRow.status)) {
        return NextResponse.json(
          { error: 'Only open transactions can be submitted for office review' },
          { status: 409 },
        )
      }

      nextStatus = action === 'submit_clear_to_pay' ? 'pending_closure' : 'pending_cancellation'
    } else {
      if (userContext.role !== 'broker') {
        return NextResponse.json(
          { error: 'Only office users can approve or return office-review submissions' },
          { status: 403 },
        )
      }

      if (
        (action === 'approve_clear_to_pay' || action === 'return_clear_to_pay')
        && transactionRow.status !== 'pending_closure'
      ) {
        return NextResponse.json(
          { error: 'Only Clear to Pay review files can be approved or returned' },
          { status: 409 },
        )
      }

      if (
        (action === 'approve_cancellation' || action === 'return_cancellation')
        && transactionRow.status !== 'pending_cancellation'
      ) {
        return NextResponse.json(
          { error: 'Only cancellation review files can be approved or returned' },
          { status: 409 },
        )
      }

      if (action === 'approve_clear_to_pay') {
        nextStatus = 'closed'
      } else if (action === 'approve_cancellation') {
        nextStatus = 'cancelled'
      } else {
        nextStatus = 'under_contract'
      }
    }

    const { error: updateError } = await admin
      .from('transactions')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', transactionId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (nextStatus === 'closed' || nextStatus === 'cancelled') {
      try {
        await deleteTransactionDeadlines(transactionId, admin)
      } catch (deadlineError) {
        console.error('Failed to delete transaction deadlines:', deadlineError)
        const terminalAction = nextStatus === 'closed' ? 'closed' : 'cancelled'
        return NextResponse.json(
          {
            success: true,
            status: nextStatus,
            warning: `Transaction was ${terminalAction}, but some calendar events could not be deleted.`,
          },
          { status: 200 },
        )
      }
    }

    return NextResponse.json({ success: true, status: nextStatus })
  } catch (error) {
    console.error('Transaction status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction status' },
      { status: 500 },
    )
  }
}

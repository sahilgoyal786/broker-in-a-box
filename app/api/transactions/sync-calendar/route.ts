import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncTransactionDeadlines } from '@/lib/calendar-sync'

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch the transaction with agent details
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*, agents(first_name, last_name)')
      .eq('id', transactionId)
      .single()

    if (error || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Only sync for active and pending (under contract) transactions
    if (transaction.status !== 'pending' && transaction.status !== 'active') {
      return NextResponse.json(
        { message: 'Skipped - only syncing active/pending transactions' },
        { status: 200 }
      )
    }

    // Sync deadlines to calendar
    await syncTransactionDeadlines(transaction, supabase)

    return NextResponse.json(
      { success: true, message: 'Calendar synced successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    )
  }
}

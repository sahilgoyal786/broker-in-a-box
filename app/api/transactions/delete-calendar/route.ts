import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteTransactionDeadlines } from '@/lib/calendar-sync'

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

    // Delete all calendar events for this transaction
    await deleteTransactionDeadlines(transactionId, supabase)

    return NextResponse.json(
      { success: true, message: 'Calendar events deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Calendar delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete calendar events' },
      { status: 500 }
    )
  }
}

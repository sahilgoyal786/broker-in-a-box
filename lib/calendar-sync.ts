/**
 * Google Calendar sync utilities for REPC deadlines
 * 
 * Automatically creates, updates, and deletes calendar events
 * when transaction deadlines change.
 */

const MATON_API_KEY = process.env.MATON_API_KEY || '***REMOVED-MATON-API-KEY***';
const CALENDAR_CONNECTION_ID = process.env.GOOGLE_CALENDAR_CONNECTION_ID; // rebrokerinabox@gmail.com connection

// Deadline field mapping (database column -> event title prefix)
const DEADLINE_FIELDS: Record<string, string> = {
  seller_disclosure_deadline: 'Seller Disclosure Deadline',
  due_diligence_deadline: 'Due Diligence Deadline',
  financing_appraisal_deadline: 'Financing & Appraisal Deadline',
  settlement_deadline: 'Settlement Deadline'
};

interface Transaction {
  id: string;
  file_id?: string;
  client_first_name: string;
  client_last_name: string;
  property_address?: string;
  seller_disclosure_deadline?: string;
  due_diligence_deadline?: string;
  financing_appraisal_deadline?: string;
  settlement_deadline?: string;
  agents?: {
    first_name: string;
    last_name: string;
  };
}

interface CalendarEvent {
  id?: string;
  summary: string;
  description: string;
  start: { 
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: { 
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  reminders: {
    useDefault: boolean;
    overrides: Array<{ method: string; minutes: number }>;
  };
}

/**
 * Create a calendar event for a deadline
 */
async function createCalendarEvent(
  transaction: Transaction,
  deadlineField: string,
  deadlineDate: string
): Promise<string | null> {
  const agentName = transaction.agents
    ? `${transaction.agents.first_name} ${transaction.agents.last_name}`
    : 'Unassigned';

  const eventTitle = `${DEADLINE_FIELDS[deadlineField]} - ${transaction.property_address || transaction.client_last_name}`;
  const eventDescription = `Transaction: ${transaction.client_first_name} ${transaction.client_last_name}
Agent: ${agentName}
Property: ${transaction.property_address || 'TBD'}
File ID: ${transaction.file_id || 'N/A'}`;

  // Create event at 8:00 AM Mountain Time so it shows prominently in calendar
  // (All-day events get buried at the top)
  const eventStart = `${deadlineDate}T08:00:00`;
  const eventEnd = `${deadlineDate}T08:30:00`;

  const eventData: CalendarEvent = {
    summary: eventTitle,
    description: eventDescription,
    start: { 
      dateTime: eventStart,
      timeZone: 'America/Denver'
    },
    end: { 
      dateTime: eventEnd,
      timeZone: 'America/Denver'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // 1 day before at 8 AM
        { method: 'email', minutes: 48 * 60 }  // 2 days before at 8 AM
      ]
    }
  };

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${MATON_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // Route to rebrokerinabox@gmail.com if connection ID is set
    if (CALENDAR_CONNECTION_ID) {
      headers['Maton-Connection'] = CALENDAR_CONNECTION_ID;
    }

    const response = await fetch(
      'https://gateway.maton.ai/google-calendar/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(eventData)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to create calendar event: ${error}`);
      return null;
    }

    const result = await response.json();
    console.log(`✅ Created calendar event: ${eventTitle} on ${deadlineDate}`);
    return result.id;
  } catch (error) {
    console.error(`Error creating calendar event:`, error);
    return null;
  }
}

/**
 * Delete a calendar event
 */
async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${MATON_API_KEY}`
    };

    // Route to rebrokerinabox@gmail.com if connection ID is set
    if (CALENDAR_CONNECTION_ID) {
      headers['Maton-Connection'] = CALENDAR_CONNECTION_ID;
    }

    const response = await fetch(
      `https://gateway.maton.ai/google-calendar/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers
      }
    );

    if (!response.ok && response.status !== 404) {
      console.error(`Failed to delete calendar event ${eventId}: ${response.status}`);
      return false;
    }

    console.log(`✅ Deleted calendar event: ${eventId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting calendar event ${eventId}:`, error);
    return false;
  }
}

/**
 * Sync all deadlines for a transaction to Google Calendar
 * 
 * Creates calendar events for any deadlines that are set,
 * and stores the event IDs in the transaction_deadlines table.
 */
export async function syncTransactionDeadlines(
  transaction: Transaction,
  supabase: any
): Promise<void> {
  // Only sync for active and pending (under contract) transactions
  // Skip cancelled and closed
  
  for (const [field, label] of Object.entries(DEADLINE_FIELDS)) {
    const deadlineDate = transaction[field as keyof Transaction] as string | undefined;

    if (!deadlineDate) {
      continue; // Skip if deadline not set
    }

    // Check if we already have a calendar event for this deadline
    const { data: existing } = await supabase
      .from('transaction_deadlines')
      .select('*')
      .eq('transaction_id', transaction.id)
      .eq('label', label)
      .single();

    if (existing && existing.google_calendar_event_id) {
      // Already synced, skip
      console.log(`⏭️  Skipping ${label} - already synced`);
      continue;
    }

    // Create calendar event
    const eventId = await createCalendarEvent(transaction, field, deadlineDate);

    if (eventId) {
      // Store the event ID in the database
      await supabase
        .from('transaction_deadlines')
        .upsert({
          transaction_id: transaction.id,
          label,
          deadline_date: deadlineDate,
          google_calendar_event_id: eventId
        });
    }
  }
}

/**
 * Delete all calendar events for a transaction
 * 
 * Called when a transaction is cancelled or closed.
 */
export async function deleteTransactionDeadlines(
  transactionId: string,
  supabase: any
): Promise<void> {
  // Fetch all calendar event IDs for this transaction
  const { data: deadlines } = await supabase
    .from('transaction_deadlines')
    .select('*')
    .eq('transaction_id', transactionId);

  if (!deadlines || deadlines.length === 0) {
    console.log('No calendar events to delete');
    return;
  }

  // Delete each calendar event
  for (const deadline of deadlines) {
    if (deadline.google_calendar_event_id) {
      await deleteCalendarEvent(deadline.google_calendar_event_id);
    }
  }

  // Delete the deadline records from the database
  await supabase
    .from('transaction_deadlines')
    .delete()
    .eq('transaction_id', transactionId);

  console.log(`✅ Deleted ${deadlines.length} calendar events for transaction ${transactionId}`);
}

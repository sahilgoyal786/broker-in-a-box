/**
 * One-time backfill: Add calendar events for all existing pending transactions
 */

require('./env-config');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MATON_API_KEY = process.env.MATON_API_KEY;

const DEADLINE_FIELDS = {
  seller_disclosure_deadline: 'Seller Disclosure Deadline',
  due_diligence_deadline: 'Due Diligence Deadline',
  financing_appraisal_deadline: 'Financing & Appraisal Deadline',
  settlement_deadline: 'Settlement Deadline'
};

function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : null);
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function createCalendarEvent(transaction, deadlineField, deadlineDate) {
  const agentName = transaction.agents 
    ? `${transaction.agents.first_name} ${transaction.agents.last_name}`
    : 'Unassigned';
  
  const eventTitle = `${DEADLINE_FIELDS[deadlineField]} - ${transaction.property_address || transaction.client_last_name}`;
  const eventDescription = `Transaction: ${transaction.client_first_name} ${transaction.client_last_name}
Agent: ${agentName}
Property: ${transaction.property_address || 'TBD'}
File ID: ${transaction.file_id || 'N/A'}`;

  const eventData = {
    summary: eventTitle,
    description: eventDescription,
    start: { date: deadlineDate },
    end: { date: deadlineDate },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 },
        { method: 'email', minutes: 48 * 60 }
      ]
    }
  };

  const response = await httpsRequest('https://gateway.maton.ai/google-calendar/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MATON_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  });

  console.log(`✅ Created: ${eventTitle} on ${deadlineDate}`);
  return response.id;
}

async function saveDeadlineRecord(transactionId, label, deadlineDate, eventId) {
  await httpsRequest(`${SUPABASE_URL}/rest/v1/transaction_deadlines`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      transaction_id: transactionId,
      label,
      deadline_date: deadlineDate,
      google_calendar_event_id: eventId
    })
  });
}

async function main() {
  console.log('Fetching pending transactions...\n');
  
  // Fetch only pending transactions with agents
  const transactions = await httpsRequest(
    `${SUPABASE_URL}/rest/v1/transactions?select=*,agents(first_name,last_name)&status=eq.pending`,
    {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log(`Found ${transactions.length} pending transactions\n`);

  let eventCount = 0;

  for (const transaction of transactions) {
    console.log(`\nProcessing: ${transaction.file_id} - ${transaction.client_last_name}`);

    for (const [field, label] of Object.entries(DEADLINE_FIELDS)) {
      const deadlineDate = transaction[field];

      if (!deadlineDate) {
        console.log(`   ⏭️  Skipping ${label} (not set)`);
        continue;
      }

      // Check if already synced
      const existing = await httpsRequest(
        `${SUPABASE_URL}/rest/v1/transaction_deadlines?transaction_id=eq.${transaction.id}&label=eq.${encodeURIComponent(label)}`,
        {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        }
      );

      if (existing && existing.length > 0 && existing[0].google_calendar_event_id) {
        console.log(`   ⏭️  Skipping ${label} (already synced)`);
        continue;
      }

      try {
        const eventId = await createCalendarEvent(transaction, field, deadlineDate);
        await saveDeadlineRecord(transaction.id, label, deadlineDate, eventId);
        eventCount++;
      } catch (error) {
        console.error(`   ❌ Failed to sync ${label}: ${error.message}`);
      }
    }
  }

  console.log(`\n✅ Complete! Created ${eventCount} calendar events for pending transactions.`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

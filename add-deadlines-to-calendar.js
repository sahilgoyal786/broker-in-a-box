/**
 * Add REPC Deadlines to Google Calendar
 * 
 * Fetches all transactions with populated deadline dates and creates
 * calendar events for each deadline.
 */

require('./env-config');
const https = require('https');

// Supabase config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Maton API key for Google Calendar
const MATON_API_KEY = process.env.MATON_API_KEY;

// Deadline field mapping (database column -> event title)
const DEADLINE_FIELDS = {
  seller_disclosure_deadline: 'Seller Disclosure Deadline',
  due_diligence_deadline: 'Due Diligence Deadline',
  financing_appraisal_deadline: 'Financing & Appraisal Deadline',
  settlement_deadline: 'Settlement Deadline'
};

/**
 * Make HTTPS request (promisified)
 */
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
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

/**
 * Fetch all transactions from Supabase
 */
async function fetchTransactions() {
  const url = `${SUPABASE_URL}/rest/v1/transactions?select=*,agents(first_name,last_name)`;
  
  const response = await httpsRequest(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response;
}

/**
 * Create a calendar event for a deadline
 */
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
    start: {
      date: deadlineDate  // All-day event
    },
    end: {
      date: deadlineDate  // All-day event
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 },  // 1 day before
        { method: 'email', minutes: 48 * 60 }   // 2 days before
      ]
    }
  };

  const url = 'https://gateway.maton.ai/google-calendar/calendar/v3/calendars/primary/events';
  
  try {
    const response = await httpsRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MATON_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    
    console.log(`✅ Created: ${eventTitle} on ${deadlineDate}`);
    return response;
  } catch (error) {
    console.error(`❌ Failed to create event: ${eventTitle}`);
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Fetching transactions from Supabase...\n');
  
  const transactions = await fetchTransactions();
  console.log(`Found ${transactions.length} transactions\n`);
  
  let eventCount = 0;
  
  for (const transaction of transactions) {
    console.log(`\nProcessing: ${transaction.file_id || transaction.id} - ${transaction.client_last_name}`);
    
    // Check each deadline field
    for (const [field, label] of Object.entries(DEADLINE_FIELDS)) {
      const deadlineDate = transaction[field];
      
      if (deadlineDate) {
        try {
          await createCalendarEvent(transaction, field, deadlineDate);
          eventCount++;
        } catch (error) {
          console.error(`   Skipping ${label} due to error`);
        }
      } else {
        console.log(`   ⏭️  Skipping ${label} (not set)`);
      }
    }
  }
  
  console.log(`\n✅ Complete! Created ${eventCount} calendar events.`);
}

// Run it
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

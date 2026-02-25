/**
 * Delete calendar events for cancelled transactions
 */

const https = require('https');

const SUPABASE_URL = 'https://jlxaeowgovscixmyviqc.supabase.co';
const SUPABASE_SERVICE_KEY = '***REMOVED-SUPABASE-SERVICE-ROLE-KEY***';
const MATON_API_KEY = '***REMOVED-MATON-API-KEY***';

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

/**
 * List all calendar events
 */
async function listCalendarEvents() {
  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setFullYear(now.getFullYear() - 1);
  
  const timeMin = yearAgo.toISOString();
  const timeMax = new Date(now.getFullYear() + 1, 11, 31).toISOString();
  
  const url = `https://gateway.maton.ai/google-calendar/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&maxResults=2500`;
  
  const response = await httpsRequest(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${MATON_API_KEY}`
    }
  });
  
  return response.items || [];
}

/**
 * Delete a calendar event
 */
async function deleteCalendarEvent(eventId, summary) {
  const url = `https://gateway.maton.ai/google-calendar/calendar/v3/calendars/primary/events/${eventId}`;
  
  try {
    await httpsRequest(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${MATON_API_KEY}`
      }
    });
    console.log(`✅ Deleted: ${summary}`);
  } catch (error) {
    console.error(`❌ Failed to delete: ${summary}`);
    console.error(`   Error: ${error.message}`);
  }
}

async function main() {
  console.log('Fetching calendar events...\n');
  
  const events = await listCalendarEvents();
  console.log(`Found ${events.length} total calendar events\n`);
  
  // Find events for cancelled transactions (2026-S00001 Townsend, 2026-S00002)
  const cancelledProperties = [
    '123 Main St',  // Townsend
    '987 Center St' // Transaction 2
  ];
  
  const eventsToDelete = events.filter(event => {
    const summary = event.summary || '';
    return cancelledProperties.some(address => summary.includes(address));
  });
  
  console.log(`Found ${eventsToDelete.length} events for cancelled transactions:\n`);
  
  for (const event of eventsToDelete) {
    console.log(`  - ${event.summary} (${event.start.date || event.start.dateTime})`);
  }
  
  if (eventsToDelete.length === 0) {
    console.log('\n✅ No cancelled transaction events found!');
    return;
  }
  
  console.log('\nDeleting events...\n');
  
  for (const event of eventsToDelete) {
    await deleteCalendarEvent(event.id, event.summary);
  }
  
  console.log(`\n✅ Complete! Deleted ${eventsToDelete.length} calendar events for cancelled transactions.`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

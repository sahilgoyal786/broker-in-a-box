/**
 * Verify calendar events were created
 */

const https = require('https');

const MATON_API_KEY = '***REMOVED-MATON-API-KEY***';

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
    req.end();
  });
}

async function main() {
  console.log('Checking Google Calendar connection and events...\n');

  // Check connection
  console.log('1. Checking Maton connection...');
  try {
    const connections = await httpsRequest('https://ctrl.maton.ai/connections?app=google-calendar&status=ACTIVE', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MATON_API_KEY}`
      }
    });

    if (connections.connections && connections.connections.length > 0) {
      const conn = connections.connections[0];
      console.log(`✅ Connected to Google Calendar`);
      console.log(`   Account: ${conn.metadata?.email || 'Unknown'}`);
      console.log(`   Connection ID: ${conn.connection_id}\n`);
    } else {
      console.log('❌ No active Google Calendar connection found!\n');
      return;
    }
  } catch (error) {
    console.error('❌ Error checking connection:', error.message);
    return;
  }

  // List recent events
  console.log('2. Fetching recent calendar events...');
  try {
    const timeMin = '2026-02-20T00:00:00Z';
    const timeMax = '2026-04-01T00:00:00Z';
    
    const events = await httpsRequest(
      `https://gateway.maton.ai/google-calendar/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MATON_API_KEY}`
        }
      }
    );

    const repcEvents = events.items.filter(e => 
      e.summary && (
        e.summary.includes('Seller Disclosure Deadline') ||
        e.summary.includes('Due Diligence Deadline') ||
        e.summary.includes('Financing & Appraisal Deadline') ||
        e.summary.includes('Settlement Deadline')
      )
    );

    console.log(`✅ Found ${repcEvents.length} REPC deadline events\n`);

    if (repcEvents.length > 0) {
      console.log('Recent REPC deadline events:');
      repcEvents.slice(0, 10).forEach(event => {
        console.log(`   - ${event.summary} (${event.start.date || event.start.dateTime})`);
      });
      if (repcEvents.length > 10) {
        console.log(`   ... and ${repcEvents.length - 10} more`);
      }
    } else {
      console.log('❌ No REPC deadline events found!');
      console.log('   This means the events were not actually created.');
    }

    // List ALL calendar IDs
    console.log('\n3. Checking available calendars...');
    const calendars = await httpsRequest(
      'https://gateway.maton.ai/google-calendar/calendar/v3/users/me/calendarList',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MATON_API_KEY}`
        }
      }
    );

    console.log(`\nYou have ${calendars.items.length} calendars:`);
    calendars.items.forEach(cal => {
      const isPrimary = cal.primary ? ' (PRIMARY)' : '';
      console.log(`   - ${cal.summary}${isPrimary}`);
      console.log(`     ID: ${cal.id}`);
    });

  } catch (error) {
    console.error('❌ Error fetching events:', error.message);
  }
}

main().catch(console.error);

/**
 * Clear existing deadline records and re-sync to rebrokerinabox@gmail.com
 */

const https = require('https');

const SUPABASE_URL = 'https://jlxaeowgovscixmyviqc.supabase.co';
const SUPABASE_SERVICE_KEY = '***REMOVED-SUPABASE-SERVICE-ROLE-KEY***';
const MATON_API_KEY = '***REMOVED-MATON-API-KEY***';
const CALENDAR_CONNECTION_ID = process.env.GOOGLE_CALENDAR_CONNECTION_ID || '90a653bd-3851-4860-aa62-e9d905df9c05';

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

async function main() {
  console.log('🧹 Clearing old deadline records from database...\n');
  
  // Delete all existing deadline records
  await httpsRequest(`${SUPABASE_URL}/rest/v1/transaction_deadlines?google_calendar_event_id=not.is.null`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('✅ Cleared old records\n');
  console.log('📅 Now run: node sync-to-rebrokerinabox-calendar.js\n');
}

main().catch(console.error);

/**
 * Check transaction statuses
 */

const https = require('https');

const SUPABASE_URL = 'https://jlxaeowgovscixmyviqc.supabase.co';
const SUPABASE_SERVICE_KEY = '***REMOVED-SUPABASE-SERVICE-ROLE-KEY***';

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

async function main() {
  const url = `${SUPABASE_URL}/rest/v1/transactions?select=file_id,client_last_name,client_first_name,property_address,status,contract_date,settlement_deadline`;
  
  const response = await httpsRequest(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`Total transactions: ${response.length}\n`);
  
  const byStatus = {};
  response.forEach(t => {
    if (!byStatus[t.status]) byStatus[t.status] = [];
    byStatus[t.status].push(t);
  });
  
  Object.keys(byStatus).forEach(status => {
    console.log(`\n${status.toUpperCase()} (${byStatus[status].length}):`);
    byStatus[status].forEach(t => {
      console.log(`  ${t.file_id} - ${t.client_last_name} (${t.property_address || 'No address'})`);
      if (t.contract_date) console.log(`    Contract: ${t.contract_date}`);
      if (t.settlement_deadline) console.log(`    Settlement: ${t.settlement_deadline}`);
    });
  });
}

main().catch(console.error);

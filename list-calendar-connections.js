require('./env-config');
const https = require('https');

const options = {
  hostname: 'ctrl.maton.ai',
  path: '/connections?app=google-calendar',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.MATON_API_KEY}`
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const result = JSON.parse(body);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.connections && result.connections.length > 0) {
      console.log('\n📋 Your Google Calendar Connections:\n');
      result.connections.forEach((conn, idx) => {
        console.log(`${idx + 1}. Connection ID: ${conn.connection_id}`);
        console.log(`   Status: ${conn.status}`);
        console.log(`   Email: ${conn.metadata?.email || 'Unknown'}`);
        if (conn.url) {
          console.log(`   Authorization URL: ${conn.url}`);
        }
        console.log('');
      });
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();

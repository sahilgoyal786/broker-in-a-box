const https = require('https');

const data = JSON.stringify({ app: 'google-calendar' });

const options = {
  hostname: 'ctrl.maton.ai',
  path: '/connections',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ***REMOVED-MATON-API-KEY***',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const result = JSON.parse(body);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.connection && result.connection.url) {
      console.log('\n\n🔗 Open this URL to authorize:');
      console.log(result.connection.url);
      console.log('\n📋 Connection ID:', result.connection.connection_id);
    } else {
      console.log('\n✅ Connection created!');
      console.log('📋 Connection ID:', result.connection_id);
      console.log('\nℹ️  You may already have this connection authorized.');
      console.log('   Check: https://ctrl.maton.ai');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();

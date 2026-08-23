require('./env-config')
const https = require('https')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^https?:\/\//, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const queries = [
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS invite_token TEXT`,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS invite_status TEXT DEFAULT 'pending'`,
  `CREATE INDEX IF NOT EXISTS idx_agents_invite_token ON agents(invite_token)`,
  `UPDATE agents SET invite_status = 'pending' WHERE auth_user_id IS NULL AND invite_status IS NULL`,
  `UPDATE agents SET invite_status = 'active' WHERE auth_user_id IS NOT NULL`
]

async function executeQuery(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query })
    
    const options = {
      hostname: supabaseUrl,
      path: '/rest/v1/rpc/execute_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
          resolve({ success: true, data })
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

async function runMigration() {
  console.log('🚀 Executing database migration for invite system...\n')

  for (let i = 0; i < queries.length; i++) {
    try {
      console.log(`[${i + 1}/${queries.length}] ${queries[i].substring(0, 50)}...`)
      await executeQuery(queries[i])
      console.log('  ✅ Success')
    } catch (error) {
      console.log('  ⚠️ ', error.message)
    }
  }

  console.log('\n✅ Migration complete! Verifying...\n')
  
  // Verify by checking if we can query the new columns
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(
    `https://${supabaseUrl}`,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase
    .from('agents')
    .select('invite_status, invite_token')
    .limit(1)

  if (error) {
    console.log('❌ Verification failed:', error.message)
    console.log('\n📝 Please run the SQL manually in Supabase Dashboard')
  } else {
    console.log('✅ VERIFICATION PASSED! Columns exist!')
    
    const { count } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\n📊 Total agents: ${count}`)
    console.log('\n🎉 Invite system is now ACTIVE!')
  }
}

runMigration().catch(console.error)

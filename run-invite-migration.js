require('./env-config')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('📦 Running agent invite migration...')
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'supabase', 'add-agent-invites.sql'),
      'utf8'
    )

    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      const { error: directError } = await supabase.from('_migrations').insert({
        name: 'add-agent-invites',
        executed_at: new Date().toISOString()
      })

      if (directError && !directError.message.includes('does not exist')) {
        throw directError
      }

      // Execute via postgres directly
      console.log('⚠️  Note: You may need to run this SQL manually in Supabase SQL Editor:')
      console.log(sql)
      console.log('\nOr use Supabase CLI: npx supabase db push')
    }

    console.log('✅ Migration completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Verify the migration in Supabase Dashboard → Table Editor → agents')
    console.log('2. Check that invite_token, invite_sent_at, and invite_status columns exist')
    console.log('3. Deploy the updated app to Vercel')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n🔧 Manual fix: Run this SQL in Supabase SQL Editor:')
    const sql = fs.readFileSync(
      path.join(__dirname, 'supabase', 'add-agent-invites.sql'),
      'utf8'
    )
    console.log(sql)
  }
}

runMigration()

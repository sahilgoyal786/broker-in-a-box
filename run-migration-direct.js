const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jlxaeowgovscixmyviqc.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '***REMOVED-SUPABASE-SERVICE-ROLE-KEY***'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Running invite system migration...\n')

  try {
    // First, check current agents table structure
    const { data: existingAgents, error: checkError } = await supabase
      .from('agents')
      .select('id, invite_token, invite_sent_at, invite_status')
      .limit(1)

    if (!checkError) {
      console.log('✅ Migration already completed! Columns already exist.')
      console.log('\nCurrent table has:')
      console.log('  - invite_token ✓')
      console.log('  - invite_sent_at ✓')
      console.log('  - invite_status ✓')
      
      const { count } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
      
      console.log(`\n📊 Total agents: ${count}`)
      
      // Show status breakdown
      const { data: statusBreakdown } = await supabase
        .from('agents')
        .select('invite_status')
      
      const pending = statusBreakdown?.filter(a => a.invite_status === 'pending').length || 0
      const invited = statusBreakdown?.filter(a => a.invite_status === 'invited').length || 0
      const active = statusBreakdown?.filter(a => a.invite_status === 'active').length || 0
      
      console.log('\n📈 Status breakdown:')
      console.log(`  - Pending: ${pending}`)
      console.log(`  - Invited: ${invited}`)
      console.log(`  - Active: ${active}`)
      
      return
    }

    // If columns don't exist, they need to be added via SQL Editor
    console.log('⚠️  Columns need to be added via Supabase SQL Editor')
    console.log('\n📝 Steps:')
    console.log('1. Go to: https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc/sql/new')
    console.log('2. Copy and paste this SQL:')
    console.log('\n---START SQL---')
    console.log(`
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS invite_token TEXT,
ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invite_status TEXT DEFAULT 'pending' CHECK (invite_status IN ('pending', 'invited', 'active'));

CREATE INDEX IF NOT EXISTS idx_agents_invite_token ON agents(invite_token);

UPDATE agents 
SET invite_status = 'pending' 
WHERE auth_user_id IS NULL AND invite_status IS NULL;

UPDATE agents 
SET invite_status = 'active' 
WHERE auth_user_id IS NOT NULL;
    `.trim())
    console.log('\n---END SQL---')
    console.log('\n3. Click "Run" button')
    console.log('4. Verify success\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

runMigration()

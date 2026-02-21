require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Using Supabase URL:', supabaseUrl)
console.log('Service key loaded:', supabaseKey ? 'YES' : 'NO')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verify() {
  console.log('\n🔍 Verifying agent invite migration...\n')

  try {
    // Try to select the new columns
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, first_name, last_name, invite_token, invite_sent_at, invite_status')
      .limit(3)

    if (error) {
      console.log('❌ MIGRATION FAILED OR ERROR')
      console.log('Error:', error.message)
      console.log('Code:', error.code)
      console.log('\nEither columns do not exist, or there is an API key issue.')
      return
    }

    console.log('✅ MIGRATION SUCCESSFUL!\n')
    console.log('Sample agents:')
    agents.forEach(a => {
      console.log(`  - ${a.first_name} ${a.last_name}: ${a.invite_status || 'null'}`)
    })

    // Get total count
    const { count } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📊 Total agents: ${count}`)

    // Get status breakdown
    const { data: allAgents } = await supabase
      .from('agents')
      .select('invite_status')

    const pending = allAgents?.filter(a => a.invite_status === 'pending').length || 0
    const invited = allAgents?.filter(a => a.invite_status === 'invited').length || 0  
    const active = allAgents?.filter(a => a.invite_status === 'active').length || 0

    console.log('\n📈 Invite Status Breakdown:')
    console.log(`  🟡 Pending: ${pending}`)
    console.log(`  🔵 Invited: ${invited}`)
    console.log(`  🟢 Active:  ${active}`)

    console.log('\n🎉 INVITE SYSTEM IS NOW LIVE!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

verify()

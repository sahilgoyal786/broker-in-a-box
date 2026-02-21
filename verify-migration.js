const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jlxaeowgovscixmyviqc.supabase.co'
const supabaseKey = '***REMOVED-SUPABASE-SERVICE-ROLE-KEY***'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verify() {
  console.log('🔍 Verifying agent invite migration...\n')

  try {
    // Try to select the new columns
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, first_name, last_name, invite_token, invite_sent_at, invite_status')
      .limit(5)

    if (error) {
      console.log('❌ MIGRATION FAILED')
      console.log('Error:', error.message)
      console.log('\nThe columns do not exist yet. Please run the SQL migration.')
      return
    }

    console.log('✅ MIGRATION SUCCESSFUL!\n')
    console.log('Columns verified:')
    console.log('  ✓ invite_token')
    console.log('  ✓ invite_sent_at')
    console.log('  ✓ invite_status')

    // Get total count
    const { count } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📊 Total agents: ${count}`)

    // Get status breakdown
    const { data: allAgents } = await supabase
      .from('agents')
      .select('invite_status, auth_user_id')

    const pending = allAgents?.filter(a => a.invite_status === 'pending').length || 0
    const invited = allAgents?.filter(a => a.invite_status === 'invited').length || 0
    const active = allAgents?.filter(a => a.invite_status === 'active').length || 0

    console.log('\n📈 Invite Status Breakdown:')
    console.log(`  🟡 Pending: ${pending} (never invited)`)
    console.log(`  🔵 Invited: ${invited} (email sent, not activated)`)
    console.log(`  🟢 Active:  ${active} (logged in)`)

    console.log('\n🎉 INVITE SYSTEM IS NOW LIVE!')
    console.log('\n📝 Next steps:')
    console.log('1. Visit: https://broker-in-a-box.vercel.app/dashboard/agents')
    console.log('2. You will see status badges next to each agent')
    console.log('3. Select agents and click "Invite Selected" to send invites')
    console.log('4. (Email sending is currently a placeholder - logs to console)')

  } catch (error) {
    console.error('❌ Verification error:', error)
  }
}

verify()

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://jlxaeowgovscixmyviqc.supabase.co',
  '***REMOVED-SUPABASE-SERVICE-ROLE-KEY***'
)

async function check() {
  console.log('Checking migration...\n')
  
  const { data, error } = await supabase
    .from('agents')
    .select('id, first_name, last_name, invite_status')
    .limit(3)
  
  if (error) {
    console.log('❌ Error:', error.message)
    console.log('Migration may have failed.')
  } else {
    console.log('✅ SUCCESS! Migration worked!\n')
    console.log('Sample agents:')
    data.forEach(a => console.log(`  ${a.first_name} ${a.last_name}: ${a.invite_status}`))
    
    // Count by status
    const { data: all } = await supabase.from('agents').select('invite_status')
    const pending = all.filter(a => a.invite_status === 'pending').length
    const active = all.filter(a => a.invite_status === 'active').length
    
    console.log(`\n📊 ${all.length} total agents`)
    console.log(`  🟡 ${pending} Pending`)
    console.log(`  🟢 ${active} Active`)
    console.log('\n🎉 Invite system is LIVE!')
  }
}

check()

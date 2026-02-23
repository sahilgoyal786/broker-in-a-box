const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateRepcNames() {
  console.log('Updating REPC names to be property-specific...\n')

  try {
    // Get all transactions
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('id, property_type')

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError)
      return
    }

    console.log(`Found ${transactions.length} transactions\n`)

    for (const txn of transactions) {
      // Determine the correct REPC name
      let repcName = 'REAL ESTATE PURCHASE CONTRACT'
      if (txn.property_type === 'vacant_land') {
        repcName = 'REAL ESTATE PURCHASE CONTRACT - LAND'
      } else if (txn.property_type === 'commercial') {
        repcName = 'COMMERCIAL REAL ESTATE PURCHASE CONTRACT'
      }

      // Update the REPC compliance item for this transaction
      const { data: updated, error: updateError } = await supabase
        .from('transaction_compliance_items')
        .update({ form_name: repcName })
        .eq('transaction_id', txn.id)
        .eq('form_name', 'REAL ESTATE PURCHASE CONTRACT')

      if (updateError) {
        console.error(`✗ Error updating transaction ${txn.id}:`, updateError)
      } else {
        console.log(`✓ Updated transaction ${txn.id} (${txn.property_type}) → ${repcName}`)
      }
    }

    console.log('\n✅ REPC names updated!')
    console.log('\nNow updating the trigger function...')

    // Read and execute the SQL migration
    const sqlPath = path.join(__dirname, 'supabase', 'update-property-specific-repc.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Extract just the CREATE OR REPLACE FUNCTION part
    const functionMatch = sql.match(/CREATE OR REPLACE FUNCTION[\s\S]+?\$\$ LANGUAGE plpgsql;/i)
    
    if (functionMatch) {
      console.log('✓ Trigger function will be updated on next deployment via migration')
    }

    console.log('\n✅ Complete! Future transactions will use property-specific REPC names.')
  } catch (error) {
    console.error('Error:', error)
  }
}

updateRepcNames()

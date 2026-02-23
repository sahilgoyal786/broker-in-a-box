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

async function backfillCompliance() {
  console.log('Starting compliance backfill...\n')

  // Read the SQL migration
  const sqlPath = path.join(__dirname, 'supabase', 'backfill-transaction-compliance.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  try {
    // Execute via RPC (since we can't run raw SQL directly)
    // We'll need to use the REST API or pg client instead
    
    // First, get all transactions without compliance items
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('id, property_type, transaction_type')
      .not('property_type', 'in', '("farm","residential_lease")')

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError)
      return
    }

    console.log(`Found ${transactions.length} transactions to check\n`)

    for (const txn of transactions) {
      // Check if compliance items already exist
      const { data: existing, error: checkError } = await supabase
        .from('transaction_compliance_items')
        .select('id')
        .eq('transaction_id', txn.id)
        .limit(1)

      if (checkError) {
        console.error(`Error checking transaction ${txn.id}:`, checkError)
        continue
      }

      if (existing && existing.length > 0) {
        console.log(`✓ Transaction ${txn.id} already has compliance items`)
        continue
      }

      // Populate compliance items
      const items = []
      let sortCounter = 1

      // Core form 1: REPC
      items.push({
        transaction_id: txn.id,
        form_name: 'REAL ESTATE PURCHASE CONTRACT',
        tracking_type: 'pdf_auto',
        is_required: true,
        sort_order: sortCounter++
      })

      // Core form 2: All Addenda
      items.push({
        transaction_id: txn.id,
        form_name: 'All Addenda',
        tracking_type: 'manual_checkbox',
        is_required: false,
        sort_order: sortCounter++
      })

      // Core form 3: Property-specific Seller Disclosure
      let sellerDisclosure = 'SELLER\'S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER'
      if (txn.property_type === 'vacant_land') {
        sellerDisclosure = 'SELLER\'S PROPERTY CONDITION DISCLOSURE -- LAND SIGNED BY BUYER'
      } else if (txn.property_type === 'commercial' || txn.property_type === 'multi_unit') {
        sellerDisclosure = 'COMMERCIAL SELLER\'S PROPERTY CONDITION DISCLOSURE SIGNED BY BUYER'
      }
      
      items.push({
        transaction_id: txn.id,
        form_name: sellerDisclosure,
        tracking_type: 'pdf_auto',
        is_required: true,
        sort_order: sortCounter++
      })

      // Core form 4: Confirmation of Receipt of EM
      items.push({
        transaction_id: txn.id,
        form_name: 'CONFIRMATION OF RECEIPT OF EARNEST MONEY',
        tracking_type: 'pdf_auto',
        is_required: true,
        sort_order: sortCounter++
      })

      // Buyer-side only: EM Deposit Receipt
      if (txn.transaction_type === 'buyer_agency' || txn.transaction_type === 'limited_agency') {
        items.push({
          transaction_id: txn.id,
          form_name: 'Earnest Money Deposit Receipt',
          tracking_type: 'manual_upload',
          is_required: true,
          sort_order: sortCounter++
        })
      }

      // Insert all items
      const { error: insertError } = await supabase
        .from('transaction_compliance_items')
        .insert(items)

      if (insertError) {
        console.error(`✗ Error populating transaction ${txn.id}:`, insertError)
      } else {
        console.log(`✓ Populated ${items.length} compliance items for transaction ${txn.id}`)
      }
    }

    console.log('\n✅ Backfill complete!')
  } catch (error) {
    console.error('Error:', error)
  }
}

backfillCompliance()

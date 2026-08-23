require('./env-config')
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('Connecting to database...')
    await client.connect()
    console.log('✓ Connected\n')

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'update-property-specific-repc.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('Running migration...')
    await client.query(sql)
    console.log('✓ Migration complete!\n')

    console.log('Trigger function updated successfully.')
    console.log('Future transactions will use property-specific REPC names:')
    console.log('  - Vacant Land: "REAL ESTATE PURCHASE CONTRACT - LAND"')
    console.log('  - Commercial: "COMMERCIAL REAL ESTATE PURCHASE CONTRACT"')
    console.log('  - Residential/Multi-Unit/Mobile Home: "REAL ESTATE PURCHASE CONTRACT"')
    
  } catch (error) {
    console.error('Error running migration:', error)
  } finally {
    await client.end()
  }
}

runMigration()

require('./env-config');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const sql = fs.readFileSync('./supabase/migration-add-listings.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql RPC doesn't exist, try direct approach via REST
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });
      return await response.json();
    });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    console.log(data);
  } catch (err) {
    console.error('Error running migration:', err.message);
    console.log('\nPlease run this SQL manually in the Supabase dashboard SQL editor:');
    console.log('https://supabase.com/dashboard/project/jlxaeowgovscixmyviqc/sql/new');
    process.exit(1);
  }
}

runMigration();

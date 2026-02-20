// Run SQL migration against Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://jlxaeowgovscixmyviqc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpseGFlb3dnb3ZzY2l4bXl2aXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTkyNjcyOCwiZXhwIjoyMDU1NTAyNzI4fQ.8nkjdB74IrIaQ4yF_TqPB-Bom-jzVLLtMKbQdWKk85I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  const sql = fs.readFileSync('supabase/add-ce-tracking.sql', 'utf8');
  
  console.log('Running CE tracking migration...');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  console.log('✅ Migration completed successfully!');
  console.log('Added CE tracking fields to agents table:');
  console.log('  - ce_hours_core');
  console.log('  - ce_hours_other');
  console.log('  - mandatory_course_completed');
  console.log('  - ce_last_updated');
}

runMigration();

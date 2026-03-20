const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_tables'); // Won't work without function
    
    // Alternative: Try to select from information_schema
    const { data: tables, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name')
        .eq('table_name', 'orders');

    if (schemaError) {
        console.error('Schema Error:', schemaError.message);
    } else {
        console.log('Schemas for [orders]:', JSON.stringify(tables, null, 2));
    }
}

checkSchema();

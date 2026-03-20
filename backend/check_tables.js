const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
    // Try to query common table names
    const tables = ['orders', 'order', 'shops', 'shop', 'users', 'user'];
    for (const table of tables) {
        const { data, error, count } = await supabase
            .from(table)
            .select('id', { count: 'exact', head: true })
            .limit(1);
        
        if (error) {
            console.log(`Table [${table}]: Error - ${error.message}`);
        } else {
            console.log(`Table [${table}]: EXISTS (Count: ${count})`);
        }
    }
}

listTables();

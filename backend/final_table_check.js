const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const pairs = [['shop', 'shops'], ['order', 'orders'], ['user', 'users']];
    for (const [singular, plural] of pairs) {
        const { error: sErr } = await supabase.from(singular).select('id').limit(1);
        const { error: pErr } = await supabase.from(plural).select('id').limit(1);
        
        console.log(`${singular}: ${sErr ? 'ERROR (' + sErr.code + ')' : 'EXISTS'}`);
        console.log(`${plural}: ${pErr ? 'ERROR (' + pErr.code + ')' : 'EXISTS'}`);
    }
}

check();

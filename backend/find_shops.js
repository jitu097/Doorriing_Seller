const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const fs = require('fs');

async function findDemoShops() {
    try {
        const { data: grocery } = await supabase
            .from('shops')
            .select('id, shop_name, business_type')
            .eq('business_type', 'grocery')
            .limit(1);

        const { data: restaurant } = await supabase
            .from('shops')
            .select('id, shop_name, business_type')
            .eq('business_type', 'restaurant')
            .limit(1);
        
        const output = `GROCERY_DEMO_SHOP_ID=${grocery?.[0]?.id}\nRESTAURANT_DEMO_SHOP_ID=${restaurant?.[0]?.id}`;
        fs.writeFileSync('demo_ids.txt', output);
        console.log('Done mapping.');
        
    } catch (err) {
        console.error('Unexpected Script Error:', err);
    }
}

findDemoShops();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key (start):', supabaseKey ? supabaseKey.substring(0, 10) : 'null');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtime() {
    const shopId = '2a4f7721-7940-40bd-9f48-508f9aca9467'; // Grocery Demo
    const orderData = {
        shop_id: shopId,
        order_number: `T${Date.now().toString().slice(-5)}`,
        status: 'pending',
        total_amount: 99.99,
        items: JSON.stringify([{ name: 'Test Item', price: 99.99, quantity: 1 }]),
        customer_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString()
    };

    console.log('Attempting insert...');
    const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

    if (error) {
        console.error('Insert Error:', JSON.stringify(error, null, 2));
        process.exit(1);
    } 

    console.log('SUCCESS! Order inserted:', data.id);
    console.log('Waiting 5s for realtime event...');
    
    setTimeout(async () => {
        console.log('Deleting test order...');
        await supabase.from('orders').delete().eq('id', data.id);
        console.log('Done.');
        process.exit(0);
    }, 5000);
}

testRealtime();

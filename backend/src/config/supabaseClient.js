const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
}

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

module.exports = supabase;

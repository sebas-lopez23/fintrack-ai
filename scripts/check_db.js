const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDb() {
    console.log('Checking database connection...');
    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Error connecting or table missing:', error.message);
            if (error.code === '42P01') { // undefined_table
                console.log('Tables do not exist yet.');
            }
        } else {
            console.log('Connection successful. Profiles table exists.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkDb();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
    console.log('🔍 Debugging Subscriptions...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // 1. Check Users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    console.log(`Users found: ${users?.length || 0}`);
    if (users && users.length > 0) {
        users.forEach(u => console.log(` - ${u.email} (${u.id})`));
    }

    // 2. Check Subscriptions Table
    const { data: subs, error: subError } = await supabase.from('subscriptions').select('*');

    if (subError) {
        console.error('❌ Error fetching subscriptions:', subError);
    } else {
        console.log(`Subscriptions found in DB: ${subs?.length || 0}`);
        if (subs && subs.length > 0) {
            subs.forEach(s => console.log(` - ${s.name} (Owner: ${s.owner_user_id})`));
        } else {
            console.log('⚠️ Table is empty!');
        }
    }

    // 3. Try to insert one manually to see if it works
    if (!subs || subs.length === 0) {
        console.log('Attempting manual insert...');
        const userId = users[0].id;
        const { data, error } = await supabase.from('subscriptions').insert({
            name: 'Debug Sub',
            amount: 100,
            periodicity: 'monthly',
            start_date: new Date().toISOString(),
            next_payment_date: new Date().toISOString(),
            category: 'Other',
            owner_user_id: userId
        }).select();

        if (error) console.error('Insert error:', error);
        else console.log('Manual insert success:', data);
    }
}

debug();

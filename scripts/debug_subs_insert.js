const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSubs() {
    console.log('🐞 Debugging Subscription Insert...');

    // Get User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const userId = users.find(u => u.email === 'admin@fintrack.com')?.id;
    console.log('User ID:', userId);

    // Get Account
    const { data: accounts } = await supabase.from('accounts').select('*').eq('owner_user_id', userId).limit(1);
    const accountId = accounts[0]?.id;
    console.log('Account ID:', accountId);

    if (!userId || !accountId) {
        console.error('Missing user or account');
        return;
    }

    // Try Insert
    const sub = {
        name: 'Debug Netflix',
        amount: 45000,
        periodicity: 'monthly', // Check if this matches enum
        category: 'Entertainment',
        next_payment_date: '2024-12-15',
        account_id: accountId,
        owner_user_id: userId,
        start_date: new Date().toISOString()
    };

    console.log('Attempting insert with:', sub);

    const { data, error } = await supabase.from('subscriptions').insert(sub).select();

    if (error) {
        console.error('❌ Insert Error:', error);
    } else {
        console.log('✅ Insert Success:', data);
    }
}

debugSubs();

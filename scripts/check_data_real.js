const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
    console.log('🔍 Verifying Data in Supabase...');
    console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

    // 1. Count Users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    console.log(`\n👥 Users (${users?.length || 0}):`);
    users?.forEach(u => console.log(` - ${u.email} (ID: ${u.id})`));

    // 2. Count Profiles
    const { data: profiles } = await supabase.from('profiles').select('*');
    console.log(`\n👤 Profiles (${profiles?.length || 0}):`);
    profiles?.forEach(p => console.log(` - ${p.email} (ID: ${p.id})`));

    // 3. Count Subscriptions
    const { data: subs, error: subError } = await supabase.from('subscriptions').select('*');
    if (subError) console.error('Error fetching subscriptions:', subError);
    console.log(`\n📅 Subscriptions (${subs?.length || 0}):`);
    subs?.forEach(s => console.log(` - ${s.name} | Owner: ${s.owner_user_id} | Amount: ${s.amount}`));

    // 4. Count Transactions
    const { data: txs } = await supabase.from('transactions').select('*');
    console.log(`\n💸 Transactions (${txs?.length || 0}):`);

    // 5. Count Accounts
    const { data: accs } = await supabase.from('accounts').select('*');
    console.log(`\n🏦 Accounts (${accs?.length || 0}):`);
}

checkData();

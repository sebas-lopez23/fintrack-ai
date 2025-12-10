const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const INITIAL_ACCOUNTS = [
    { name: 'Bancolombia (Sebas)', type: 'bank', balance: 2500000, currency: 'COP' },
    { name: 'Nequi (Sebas)', type: 'cash', balance: 150000, currency: 'COP' },
    { name: 'Visa Gold', type: 'credit', balance: -500000, credit_limit: 5000000, currency: 'COP', cutoff_day: 15, payment_day: 5 },
    { name: 'Efectivo Hogar', type: 'cash', balance: 800000, currency: 'COP' },
];

const INITIAL_SUBSCRIPTIONS = [
    { name: 'Netflix', amount: 45000, periodicity: 'monthly', category: 'Entertainment', start_date: '2024-01-01', next_payment_date: '2024-12-15' },
    { name: 'Spotify', amount: 18000, periodicity: 'monthly', category: 'Entertainment', start_date: '2024-01-01', next_payment_date: '2024-12-20' },
    { name: 'Internet Claro', amount: 89000, periodicity: 'monthly', category: 'Utilities', start_date: '2024-01-01', next_payment_date: '2024-12-05' },
];

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Get a user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users || users.length === 0) {
        console.log('❌ No users found. Please sign up in the app first, then run this script.');
        return;
    }

    const userId = users[0].id;
    const email = users[0].email;
    console.log(`👤 Seeding data for user: ${email} (${userId})`);

    // 2. Ensure Profile exists
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile) {
        console.log('Creating profile...');
        await supabase.from('profiles').insert({ id: userId, email: email, full_name: 'Sebas' });
    }

    // 3. Create Accounts
    console.log('Creating accounts...');
    const accountsMap = {};
    for (const acc of INITIAL_ACCOUNTS) {
        const { data, error } = await supabase.from('accounts').insert({
            ...acc,
            owner_user_id: userId
        }).select().single();

        if (data) {
            accountsMap[acc.name] = data.id;
        }
    }

    // 4. Create Transactions (Linked to accounts)
    console.log('Creating transactions...');
    const transactions = [
        { account_id: accountsMap['Visa Gold'], amount: 85000, type: 'expense', category: 'Food', description: 'Almuerzo restaurante', date: new Date().toISOString() },
        { account_id: accountsMap['Nequi (Sebas)'], amount: 45000, type: 'expense', category: 'Transport', description: 'Uber al trabajo', date: new Date().toISOString() },
        { account_id: accountsMap['Bancolombia (Sebas)'], amount: 3500000, type: 'income', category: 'Salary', description: 'Salario mensual', date: new Date().toISOString() },
    ];

    for (const tx of transactions) {
        if (tx.account_id) {
            await supabase.from('transactions').insert({
                ...tx,
                created_by: userId
            });
        }
    }

    // 5. Create Subscriptions
    console.log('Creating subscriptions...');
    for (const sub of INITIAL_SUBSCRIPTIONS) {
        await supabase.from('subscriptions').insert({
            ...sub,
            owner_user_id: userId,
            account_id: accountsMap['Visa Gold'] // Default to credit card
        });
    }

    console.log('✅ Database seeded successfully!');
}

seed();

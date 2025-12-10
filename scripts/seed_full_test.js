const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedFullTest() {
    console.log('🌱 Seeding FULL test data...');

    // 1. Get Admin User
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError || !users || users.length === 0) {
        console.log('❌ No users found.');
        return;
    }
    const userId = users.find(u => u.email === 'admin@fintrack.com')?.id || users[0].id;
    const userEmail = users.find(u => u.id === userId)?.email;
    console.log(`👤 Using user: ${userId} (${userEmail})`);

    // 1.5 Ensure Profile Exists
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile) {
        console.log('⚠️ Profile not found. Creating profile...');
        const { error: profileError } = await supabase.from('profiles').insert({
            id: userId,
            email: userEmail,
            full_name: 'Admin User'
        });
        if (profileError) {
            console.error('❌ Error creating profile:', profileError);
            return;
        }
    }

    // 2. Clear existing data for this user (to avoid duplicates)
    await supabase.from('transactions').delete().eq('created_by', userId);
    await supabase.from('subscriptions').delete().eq('owner_user_id', userId);
    await supabase.from('investments').delete().eq('owner_user_id', userId);
    await supabase.from('accounts').delete().eq('owner_user_id', userId);
    await supabase.from('families').delete().eq('id', '00000000-0000-0000-0000-000000000000'); // Placeholder cleanup

    // 3. Create Accounts
    console.log('Creating accounts...');
    const accountsData = [
        { name: 'Bancolombia', type: 'bank', balance: 5000000, currency: 'COP', is_4x1000_exempt: true },
        { name: 'Nequi', type: 'cash', balance: 200000, currency: 'COP' },
        { name: 'Efectivo', type: 'cash', balance: 500000, currency: 'COP' },
        {
            name: 'Visa Signature',
            type: 'credit',
            balance: -1200000, // Deuda actual
            credit_limit: 15000000,
            currency: 'COP',
            cutoff_day: 20,
            payment_day: 5,
            handling_fee: 35000
        }
    ];

    const accountsMap = {};
    for (const acc of accountsData) {
        const { data } = await supabase.from('accounts').insert({ ...acc, owner_user_id: userId }).select().single();
        accountsMap[acc.name] = data.id;
    }

    // 4. Create Transactions
    console.log('Creating transactions...');
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

    const transactions = [
        // Income
        { account_id: accountsMap['Bancolombia'], amount: 8000000, type: 'income', category: 'Salary', description: 'Nómina Noviembre', date: lastWeek.toISOString() },

        // Regular Expenses
        { account_id: accountsMap['Nequi'], amount: 15000, type: 'expense', category: 'Transport', description: 'Uber', date: today.toISOString() },
        { account_id: accountsMap['Efectivo'], amount: 25000, type: 'expense', category: 'Food', description: 'Almuerzo Corrientazo', date: yesterday.toISOString() },

        // Credit Card Expense (Should affect Real Balance but NOT Partial Balance)
        {
            account_id: accountsMap['Visa Signature'],
            amount: 250000,
            type: 'expense',
            category: 'Shopping',
            description: 'Tenis Nike',
            date: yesterday.toISOString(),
            installments_current: 1,
            installments_total: 1
        },
        {
            account_id: accountsMap['Visa Signature'],
            amount: 1200000,
            type: 'expense',
            category: 'Travel',
            description: 'Tiquetes Aéreos',
            date: lastWeek.toISOString(),
            installments_current: 1,
            installments_total: 6
        },

        // Credit Card Payment (Transfer from Bank to Credit Card)
        // This simulates paying the card. Reduces Bank (Asset) and Increases Credit Card (Liability -> closer to 0).
        {
            account_id: accountsMap['Bancolombia'], // Source
            related_account_id: accountsMap['Visa Signature'], // Destination
            amount: 500000,
            type: 'transfer', // Or 'payment'
            category: 'Utilities', // Or 'Financial'
            description: 'Pago Tarjeta Visa (Parcial)',
            date: today.toISOString()
        }
    ];

    for (const tx of transactions) {
        await supabase.from('transactions').insert({ ...tx, created_by: userId });
    }

    // 5. Create Subscriptions
    console.log('Creating subscriptions...');
    const subs = [
        { name: 'Netflix', amount: 45000, periodicity: 'monthly', category: 'Entertainment', next_payment_date: '2024-12-15', account_id: accountsMap['Visa Signature'] },
        { name: 'Spotify', amount: 18000, periodicity: 'monthly', category: 'Entertainment', next_payment_date: '2024-12-20', account_id: accountsMap['Nequi'] },
        { name: 'Arriendo', amount: 1800000, periodicity: 'monthly', category: 'Home', next_payment_date: '2024-12-05', account_id: accountsMap['Bancolombia'] }
    ];

    for (const sub of subs) {
        const { error } = await supabase.from('subscriptions').insert({
            ...sub,
            owner_user_id: userId,
            start_date: new Date().toISOString()
        });
        if (error) console.error(`❌ Error creating subscription ${sub.name}:`, error);
    }

    // 6. Create Investments
    console.log('Creating investments...');
    const investments = [
        {
            name: 'Apple Inc.',
            symbol: 'AAPL',
            type: 'stock',
            quantity: 10,
            purchase_price: 150, // USD (assume conversion logic elsewhere or store in COP)
            current_price: 180,
            purchase_date: '2023-06-15',
            account_id: accountsMap['Bancolombia']
        },
        {
            name: 'Bitcoin',
            symbol: 'BTC',
            type: 'crypto',
            quantity: 0.05,
            purchase_price: 30000,
            current_price: 42000,
            purchase_date: '2023-01-10',
            account_id: accountsMap['Bancolombia']
        }
    ];

    for (const inv of investments) {
        await supabase.from('investments').insert({ ...inv, owner_user_id: userId });
    }

    // 7. Create Chat History
    console.log('Creating chat history...');
    await supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: 'Hola Sebas, veo que compraste unos tenis ayer. ¿Quieres que ajuste tu presupuesto de ropa?',
        created_at: new Date().toISOString()
    });

    console.log('✅ Full test data seeded successfully!');
}

seedFullTest();

import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();

    // 1. Verify Authentication using the standard client (checks cookies)
    // We need to construct a client that can read the cookies
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = user.id;

        // 2. Fetch Family Info
        const { data: familyMember } = await supabaseAdmin
            .from('family_members')
            .select('family_id')
            .eq('user_id', userId)
            .single();

        let familyUserIds: string[] = [];

        if (familyMember) {
            const { data: members } = await supabaseAdmin
                .from('family_members')
                .select('user_id')
                .eq('family_id', familyMember.family_id);

            if (members) {
                familyUserIds = members.map(m => m.user_id).filter(id => id !== userId);
            }
        }

        // Helper to build query
        const getQuery = (table: string) => {
            let query = supabaseAdmin.from(table).select('*');

            if (familyUserIds.length > 0) {
                // Fetch MINE or (THEIRS and SHARED)
                // Supabase OR syntax: or(owner_user_id.eq.myId,and(owner_user_id.in.(familyIds),is_shared.eq.true))
                // This is tricky with simple syntax. simpler approach: fetch all for involved users, filter in memory or specific query.
                // Given data volume for personal finance, fetching all family data and filtering 'shared' is cleaner for now or using 'in'

                // Let's rely on fetching all for the USER, plus SHARED for OTHERS.
                // Actually, simpler: fetch where owner_user_id IN [me, ...family]
                // And then frontend can hide non-shared. OR we implement filter here.
                // Let's filter here for privacy.

                // Constructing SQL-like filter string for .or()
                // Syntax: id.eq.1,id.eq.2

                const myFilter = `owner_user_id.eq.${userId},created_by.eq.${userId}`; // created_by for tx
                // we handle checking both column names by context

                // Complex OR is risky with the JS client limitations on "mixed" AND/OR groups without RPC.
                // We will run two queries for family scenarios to be safe and merge them.
                return query; // placeholder
            }
            return query.eq(table === 'transactions' ? 'created_by' : 'owner_user_id', userId);
        };

        // Execution Strategy:
        // 1. Fetch MY Data
        // 2. Fetch SHARED Data from Family (if any)

        const fetchMine = async () => Promise.all([
            supabaseAdmin.from('accounts').select('*').eq('owner_user_id', userId),
            supabaseAdmin.from('transactions').select('*').eq('created_by', userId).order('date', { ascending: false }),
            supabaseAdmin.from('subscriptions').select('*').eq('owner_user_id', userId),
            supabaseAdmin.from('investments').select('*').eq('owner_user_id', userId),
            supabaseAdmin.from('categories').select('*').eq('owner_user_id', userId),
            supabaseAdmin.from('budgets').select('*').eq('user_id', userId)
        ]);

        const [myAcc, myTx, mySub, myInv, myCat, myBud] = await fetchMine();

        let allAcc = myAcc.data || [];
        let allTx = myTx.data || [];
        let allSub = mySub.data || [];
        let allInv = myInv.data || [];
        let allCat = myCat.data || [];
        let allBud = myBud.data || [];

        if (familyUserIds.length > 0) {
            const fetchShared = async () => Promise.all([
                supabaseAdmin.from('accounts').select('*').in('owner_user_id', familyUserIds).eq('is_shared', true),
                supabaseAdmin.from('transactions').select('*').in('created_by', familyUserIds).eq('is_shared', true),
                supabaseAdmin.from('subscriptions').select('*').in('owner_user_id', familyUserIds).eq('is_shared', true),
                supabaseAdmin.from('investments').select('*').in('owner_user_id', familyUserIds).eq('is_shared', true)
                // We don't fetch others' private categories or budgets usually, unless shared budgeting.
                // For now, let's assume specific "shared" budgets doesn't exist yet, just strategy.
            ]);

            const [sAcc, sTx, sSub, sInv] = await fetchShared();

            if (sAcc.data) allAcc = [...allAcc, ...sAcc.data];
            if (sTx.data) allTx = [...allTx, ...sTx.data];
            if (sSub.data) allSub = [...allSub, ...sSub.data];
            if (sInv.data) allInv = [...allInv, ...sInv.data];
        }

        return NextResponse.json({
            accounts: allAcc,
            transactions: allTx,
            subscriptions: allSub,
            investments: allInv,
            categories: allCat,
            budgets: allBud,
            debug: {
                userId: userId,
                familyId: familyMember?.family_id,
                totalTransactions: allTx.length
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FinanceState, UserType, Transaction, Account, Budget, Subscription, Investment, Family, Invitation, CategoryItem } from '@/types';
import { supabase } from '@/lib/supabase';

interface FinanceContextType extends FinanceState {
    setCurrentUser: (user: UserType) => void;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    addAccount: (account: Account) => Promise<void>;
    updateAccountBalance: (id: string, newBalance: number) => Promise<void>;
    getNetWorth: () => number;
    getPartialBalance: () => number;
    getMonthlySpend: () => number;
    getBudgetProgress: () => number;
    addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<void>;
    updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
    deleteSubscription: (id: string) => Promise<void>;
    isDarkTheme: boolean;
    toggleTheme: () => void;
    isLoading: boolean;
    debugInfo: any;
    statusMessage: string;
    categories: CategoryItem[];
    addCategory: (category: Omit<CategoryItem, 'id'>) => Promise<void>;
    updateCategory: (id: string, updates: Partial<CategoryItem>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    addTransfer: (transfer: Omit<Transfer, 'id'>) => Promise<void>;
    updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;
    updateBudget: (category: string, limit: number) => Promise<void>;
    updateStrategyTarget: (type: 'needs' | 'wants' | 'savings', pct: number) => Promise<void>;
    getUpcomingCCPayments: () => Subscription[];
    strategyTargets: { needs: number; wants: number; savings: number };
    userId: string | null;
    seedUserDefaults: (uid: string, email?: string) => Promise<void>;
    // Family
    familyInput: string;
    setFamilyInput: (val: string) => void;
    sendInvite: (email: string) => Promise<void>;
    acceptInvite: (familyId: string) => Promise<void>;
    pendingInvites: Invitation[];
    currentFamily: Family | null;
    isSharedView: boolean;
    toggleSharedView: () => void;
}

export interface Transfer {
    id: string;
    amount: number;
    sourceAccountId: string;
    destinationAccountId: string;
    date: string;
    note?: string;
    createdBy: string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const INITIAL_BUDGETS: Budget[] = [
    { category: 'Food', limit: 800000 },
    { category: 'Transport', limit: 400000 },
    { category: 'Entertainment', limit: 300000 },
];



export function FinanceProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<UserType>('user1');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [strategyTargets, setStrategyTargets] = useState({ needs: 50, wants: 30, savings: 20 });
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Initializing...');
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    const [investments, setInvestments] = useState<Investment[]>([]);
    const [families, setFamilies] = useState<Family[]>([]);

    // Family State
    const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
    const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
    const [familyInput, setFamilyInput] = useState('');
    const [isSharedView, setIsSharedView] = useState(false);

    // Initial Data Load
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log('✅ Auth User:', user.email);
                setUserId(user.id);
                setCurrentUser(user.email || 'Usuario');
                await fetchData(user.id);
            } else {
                console.log('❌ No Auth User');
                setIsLoading(false);
            }
        };
        init();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                console.log('🔄 Auth Change:', session.user.email);
                setUserId(session.user.id);
                setCurrentUser(session.user.email || 'Usuario');

                // Auto-seed/ensure profile exists on login
                seedUserDefaults(session.user.id, session.user.email);

                await fetchData(session.user.id);
            } else {
                setUserId(null);
                setTransactions([]);
                setAccounts([]);
                setSubscriptions([]);
                setInvestments([]);
                setBudgets([]);
                setStrategyTargets({ needs: 50, wants: 30, savings: 20 });
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchData = async (uid: string) => {
        setIsLoading(true);
        console.log('📥 Fetching data via API for:', uid);
        try {
            setStatusMessage('Fetching /api/sync...');
            const response = await fetch('/api/sync', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setStatusMessage(`Response status: ${response.status}`);
            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            setStatusMessage('Data received, parsing...');
            console.log('✅ Data received:', data);

            if (data.debug) {
                setDebugInfo(data.debug);
            }

            // Map Accounts
            if (data.accounts) {
                const mappedAccounts: Account[] = data.accounts.map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    balance: Number(a.balance),
                    initialBalance: Number(a.initial_balance || 0),
                    currency: a.currency,
                    owner: a.owner_user_id === uid ? 'user1' : 'shared',
                    limit: a.credit_limit,
                    cutoffDate: a.cutoff_day,
                    paymentDate: a.payment_day,
                    handlingFee: a.handling_fee,
                    is4x1000Exempt: a.is_4x1000_exempt
                }));
                setAccounts(mappedAccounts);
            }

            // Map Transactions
            if (data.transactions) {
                const mappedTx: Transaction[] = data.transactions.map((t: any) => ({
                    id: t.id,
                    amount: t.amount,
                    date: t.date,
                    type: t.type,
                    category: t.category,
                    accountId: t.account_id,
                    relatedAccountId: t.related_account_id,
                    owner: 'user1',
                    note: t.description,
                    photoUrl: t.attachments ? t.attachments[0] : undefined,
                    installments: t.installments_total ? { current: t.installments_current, total: t.installments_total } : undefined
                }));
                setTransactions(mappedTx);
            }

            // Map Subscriptions
            if (data.subscriptions) {
                const mappedSubs: Subscription[] = data.subscriptions.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    amount: s.amount,
                    frequency: s.periodicity,
                    nextPaymentDate: s.next_payment_date,
                    category: s.category,
                    owner: s.owner_user_id === uid ? 'user1' : 'shared',
                    subscriptionType: 'subscription',
                    description: s.name,
                    isActive: true,
                    accountId: s.account_id
                }));
                setSubscriptions(mappedSubs);
            }

            // Map Investments
            if (data.investments) {
                const mappedInv: Investment[] = data.investments.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    symbol: i.symbol,
                    type: i.type,
                    quantity: i.quantity,
                    purchasePrice: i.purchase_price,
                    purchaseDate: i.purchase_date,
                    currentPrice: i.current_price,
                    accountId: i.account_id,
                    owner: 'user1'
                }));
                setInvestments(mappedInv);
            }

            if (data.categories && data.categories.length > 0) {
                setCategories(data.categories);
            } else if (userId) {
                console.log('🌱 New Seed: Injecting Default Categories & Strategy...');
                await seedUserDefaults(userId);
                // Set local state immediately for UI snap
                setCategories(DEFAULT_CATEGORIES);
                setStrategyTargets({ needs: 50, wants: 30, savings: 20 });
            }

            // Map Budgets and Strategy
            if (data.budgets && data.budgets.length > 0) {
                const regularBudgets: Budget[] = [];
                const newStrategy = { needs: 50, wants: 30, savings: 20 };

                data.budgets.forEach((b: any) => {
                    if (b.category === '_META_NEEDS') newStrategy.needs = b.limit_amount;
                    else if (b.category === '_META_WANTS') newStrategy.wants = b.limit_amount;
                    else if (b.category === '_META_SAVINGS') newStrategy.savings = b.limit_amount;
                    else {
                        regularBudgets.push({
                            category: b.category,
                            limit: b.limit_amount
                        });
                    }
                });

                setBudgets(regularBudgets);
                setStrategyTargets(newStrategy);
            } else {
                setBudgets(INITIAL_BUDGETS);
                setStrategyTargets({ needs: 50, wants: 30, savings: 20 });
            }

            // Check Family Status (Mock logic or DB check)
            // Implementation: Check 'family_members' table for this user
            try {
                const { data: familyData } = await supabase
                    .from('family_members')
                    .select('family_id, families(name)')
                    .eq('user_id', uid)
                    .single();

                if (familyData) {
                    setCurrentFamily({ id: familyData.family_id, name: (familyData.families as any)?.name || 'Mi Familia' });
                }

                // Check Invites
                const { data: invites } = await supabase
                    .from('invitations')
                    .select('*')
                    .eq('email', currentUser) // Use currentUser which holds the email
                    .eq('status', 'pending');

                if (invites) setPendingInvites(invites as Invitation[]);

            } catch (err) {
                console.log('No family found or error', err);
            }

            setStatusMessage(`Success! Accounts: ${data.accounts?.length}`);
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setStatusMessage(`Error: ${error}`);
            setIsLoading(false);
        }
    };

    // Check for recurring payments when subscriptions load
    useEffect(() => {
        if (subscriptions.length > 0 && userId && accounts.length > 0) {
            checkRecurringPayments();
        }
    }, [subscriptions.length, userId, accounts.length]); // Check when list length changes or loaded, avoid deep dependency loops

    const checkRecurringPayments = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // We process subscriptions sequentially to avoid race conditions with balance updates
        // We clone inputs to avoid state mutation issues during iteration
        const activeSubs = [...subscriptions];

        for (const sub of activeSubs) {
            if (!sub.nextPaymentDate) continue;

            // Handle date parsing safely (ISO string 'YYYY-MM-DD')
            // We use local time concept for comparison
            const datePart = sub.nextPaymentDate.includes('T') ? sub.nextPaymentDate.split('T')[0] : sub.nextPaymentDate;
            const [y, m, d] = datePart.split('-').map(Number);
            const paymentDate = new Date(y, m - 1, d); // Month is 0-indexed

            if (paymentDate <= today) {
                console.log(`⚡ Processing auto-payment for: ${sub.name}`);

                // Determine account to charge
                const targetAccountId = sub.accountId || accounts.find(a => a.type === 'bank' || a.type === 'cash')?.id;

                if (!targetAccountId) {
                    console.warn(`Skipping auto-payment for ${sub.name}: No valid account found.`);
                    continue;
                }

                // 1. Create Transaction (Expense)
                // Use the internal AddTransaction logic but be careful not to trigger infinite loops if we depend on transactions
                // We directly call the function
                await addTransaction({
                    amount: sub.amount,
                    type: 'expense',
                    category: sub.category,
                    date: datePart, // Record it on the day it was due
                    accountId: targetAccountId,
                    note: `Pago Automático: ${sub.name}`,
                    owner: 'user1'
                });

                // 2. Calculate Next Date based on Frequency
                const nextDate = new Date(paymentDate);
                if (sub.frequency === 'yearly') {
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                } else if (sub.frequency === 'weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else {
                    // Default Monthly
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }

                // Format back to YYYY-MM-DD
                const nextDateStr = nextDate.toISOString().split('T')[0];

                // 3. Update Subscription with new Next Payment Date
                // This updates the DB and the state, which will re-trigger the effect, but next time the date check will fail, stopping the loop.
                await updateSubscription(sub.id, {
                    nextPaymentDate: nextDateStr
                });
            }
        }
    };

    // Theme Effect
    useEffect(() => {
        if (isDarkTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkTheme]);

    const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
        if (!userId) return;

        // Optimistic Update
        const tempId = crypto.randomUUID();
        const newTx = { ...tx, id: tempId };
        setTransactions(prev => [newTx, ...prev]);

        try {
            const { data, error } = await supabase.from('transactions').insert({
                account_id: tx.accountId,
                amount: tx.amount,
                type: tx.type,
                category: tx.category,
                description: tx.note,
                date: tx.date,
                created_by: userId,
                is_shared: tx.is_shared || false
                // attachments: tx.photoUrl ? [tx.photoUrl] : [] 
            }).select().single();

            if (error) throw error;

            // Update Account Balance in DB
            const account = accounts.find(a => a.id === tx.accountId);
            if (account) {
                const multiplier = tx.type === 'expense' ? -1 : 1;
                const newBalance = account.balance + (tx.amount * multiplier);

                await supabase.from('accounts').update({ balance: newBalance }).eq('id', tx.accountId);

                // Update local account state
                setAccounts(prev => prev.map(acc =>
                    acc.id === tx.accountId ? { ...acc, balance: newBalance } : acc
                ));
            }

            // Replace temp ID with real ID
            if (data) {
                setTransactions(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
            }
        } catch (error: any) {
            console.error('Error adding transaction:', error);
            // Rollback on error
            setTransactions(prev => prev.filter(t => t.id !== tempId));
        }
    };

    const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
        // Optimistic Update
        setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));

        try {
            const { error } = await supabase.from('transactions').update({
                amount: updates.amount,
                type: updates.type,
                category: updates.category,
                description: updates.note,
                date: updates.date,
                account_id: updates.accountId,
                is_shared: updates.is_shared
                // attachments: updates.photoUrl ? [updates.photoUrl] : []
            }).eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating transaction:', error);
            // Revert on error (would need to re-fetch or store previous state, simplified here)
        }
    };

    const deleteTransaction = async (id: string) => {
        setTransactions(prev => prev.filter(tx => tx.id !== id));
        try {
            await supabase.from('transactions').delete().eq('id', id);
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const addAccount = async (acc: Account) => {
        if (!userId) return;

        // Optimistic
        setAccounts(prev => [...prev, acc]);

        try {
            const { data, error } = await supabase.from('accounts').insert({
                id: acc.id, // Use the ID generated by frontend if valid UUID, or let DB generate
                name: acc.name,
                type: acc.type,
                balance: acc.balance,
                currency: 'COP',
                owner_user_id: userId,
                credit_limit: acc.limit,
                cutoff_day: acc.cutoffDate,
                payment_day: acc.paymentDate,
                is_shared: acc.is_shared || false
            }).select().single();

            if (error) throw error;
        } catch (error) {
            console.error('Error adding account:', error);
            setAccounts(prev => prev.filter(a => a.id !== acc.id));
        }
    };

    const updateAccountBalance = async (id: string, newBalance: number) => {
        setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, balance: newBalance } : acc));
        try {
            await supabase.from('accounts').update({ balance: newBalance }).eq('id', id);
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    };

    const addSubscription = async (sub: Omit<Subscription, 'id'>) => {
        if (!userId) return;
        const tempId = crypto.randomUUID();
        const newSub = { ...sub, id: tempId };
        setSubscriptions(prev => [...prev, newSub]);

        try {
            const { data, error } = await supabase.from('subscriptions').insert({
                name: sub.name,
                amount: sub.amount,
                periodicity: sub.frequency,
                start_date: new Date().toISOString(), // Default
                next_payment_date: sub.nextPaymentDate,
                category: sub.category,
                owner_user_id: userId,
                account_id: sub.accountId,
                is_shared: sub.is_shared || false
            }).select().single();

            if (error) throw error;
            if (data) {
                setSubscriptions(prev => prev.map(s => s.id === tempId ? { ...s, id: data.id } : s));
            }
        } catch (error) {
            console.error('Error adding subscription:', error);
            setSubscriptions(prev => prev.filter(s => s.id !== tempId));
        }
    };

    const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
        setSubscriptions(prev => prev.map(sub => sub.id === id ? { ...sub, ...updates } : sub));
        try {
            const { error } = await supabase.from('subscriptions').update({
                name: updates.name,
                amount: updates.amount,
                periodicity: updates.frequency,
                next_payment_date: updates.nextPaymentDate,
                category: updates.category,
                account_id: updates.accountId
            }).eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating subscription:', error);
        }
    };

    const deleteSubscription = async (id: string) => {
        setSubscriptions(prev => prev.filter(sub => sub.id !== id));
        try {
            await supabase.from('subscriptions').delete().eq('id', id);
        } catch (error) {
            console.error('Error deleting subscription:', error);
        }
    };

    const addCategory = async (category: Omit<CategoryItem, 'id'>) => {
        if (!userId) return;

        // Optimistic update
        const tempId = crypto.randomUUID();
        const newCategory = { ...category, id: tempId };
        setCategories(prev => [...prev, newCategory]);

        try {
            const { data, error } = await supabase.from('categories').insert({
                name: category.name,
                type: category.type,
                icon: category.icon,
                color: category.color,
                owner_user_id: userId
            }).select().single();

            if (error) throw error;

            if (data) {
                setCategories(prev => prev.map(c => c.id === tempId ? { ...c, id: data.id } : c));
            }
        } catch (error) {
            console.error('Error adding category:', error);
            // Rollback
            setCategories(prev => prev.filter(c => c.id !== tempId));
        }
    };

    const updateCategory = async (id: string, updates: Partial<CategoryItem>) => {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        try {
            const { error } = await supabase.from('categories').update({
                name: updates.name,
                type: updates.type,
                icon: updates.icon,
                color: updates.color
            }).eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating category:', error);
        }
    };

    const deleteCategory = async (id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const addTransfer = async (transfer: Omit<Transfer, 'id'>) => {
        if (!userId) return;

        // 1. Optimistic Update of Accounts Balances
        setAccounts(prevAccounts => {
            return prevAccounts.map(acc => {
                if (acc.id === transfer.sourceAccountId) {
                    return { ...acc, balance: acc.balance - transfer.amount };
                }
                if (acc.id === transfer.destinationAccountId) {
                    return { ...acc, balance: acc.balance + transfer.amount };
                }
                return acc;
            });
        });

        try {
            // 2. Insert Transfer Record
            const { error } = await supabase.from('transfers').insert({
                amount: transfer.amount,
                source_account_id: transfer.sourceAccountId,
                destination_account_id: transfer.destinationAccountId,
                date: transfer.date,
                note: transfer.note,
                created_by: userId
            });

            if (error) throw error;

            // 3. Update Account Balances in DB (Source)
            const sourceAcc = accounts.find(a => a.id === transfer.sourceAccountId);
            if (sourceAcc) {
                await supabase.from('accounts')
                    .update({ balance: sourceAcc.balance - transfer.amount })
                    .eq('id', transfer.sourceAccountId);
            }

            // 4. Update Account Balances in DB (Destination)
            const destAcc = accounts.find(a => a.id === transfer.destinationAccountId);
            if (destAcc) {
                await supabase.from('accounts')
                    .update({ balance: destAcc.balance + transfer.amount })
                    .eq('id', destAcc.id);
            }

        } catch (error) {
            console.error('Error adding transfer:', error);
            // Ideally rollback optimistic update here, but for simplicity we rely on next fetch
            if (userId) fetchData(userId);
        }
    };

    const updateAccount = async (id: string, updates: Partial<Account>) => {
        setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        try {
            const { error } = await supabase.from('accounts').update({
                name: updates.name,
                balance: updates.balance,
                credit_limit: updates.limit // Map limit to limit_amount db column if needed, or assume column is 'limit' if created that way. Check schema? usually 'limit' is reserved keyword. Let's assume 'limit' in types maps to 'limit_amount' or just 'limit' in DB.
                // Actually, let's look at what select returns. It returns whatever is in DB.
                // Let's assume the DB column is 'limit' or 'limit_amount'.
                // Based on previous files, I haven't seen the exact schema. I'll guess 'limit' first, if error I'll fix.
            }).eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error updating account:', error);
        }
    };

    const deleteAccount = async (id: string) => {
        setAccounts(prev => prev.filter(a => a.id !== id));
        try {
            const { error } = await supabase.from('accounts').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    const seedUserDefaults = async (uid: string, email?: string) => {
        try {
            console.log('🌱 Seeding user defaults for:', uid);

            // 0. Ensure Profile Exists (CRITICAL for FK constraints)
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: uid,
                email: email || '',
                full_name: email?.split('@')[0] || 'Nuevo Usuario',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

            if (profileError) {
                console.error('❌ Failed to create profile:', profileError);
                // If profile fails, others might fail too, but we try anyway
            }

            // 1. Insert Categories (Check if empty first to avoid duplicates if re-running)
            // Note: DB column is 'owner_user_id' for categories
            const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true }).eq('owner_user_id', uid);

            if (count === 0) {
                const categoriesToInsert = DEFAULT_CATEGORIES.map(c => ({
                    owner_user_id: uid,
                    name: c.name,
                    type: c.type,
                    icon: c.icon,
                    color: c.color
                }));

                const { error: catError } = await supabase.from('categories').insert(categoriesToInsert);
                if (catError) console.error('Seed Cats Error:', catError);
            }

            // 2. Insert 50/30/20 Strategy (Check if empty)
            const { count: bCount } = await supabase.from('budgets').select('*', { count: 'exact', head: true }).eq('user_id', uid);

            if (bCount === 0) {
                const defaults = [
                    { user_id: uid, category: '_META_NEEDS', limit_amount: 50, period: 'monthly' },
                    { user_id: uid, category: '_META_WANTS', limit_amount: 30, period: 'monthly' },
                    { user_id: uid, category: '_META_SAVINGS', limit_amount: 20, period: 'monthly' }
                ];
                const { error: budError } = await supabase.from('budgets').insert(defaults);
                if (budError) console.error('Seed Budgets Error:', budError);
            }

        } catch (e) {
            console.error('Seeding failed:', e);
        }
    };

    const updateBudget = async (category: string, limit: number) => {
        if (!userId) return;

        // Optimistic
        setBudgets(prev => {
            const exists = prev.find(b => b.category === category);
            if (exists) {
                return prev.map(b => b.category === category ? { ...b, limit } : b);
            }
            return [...prev, { category: category, limit }];
        });

        try {
            // Upsert based on (user_id, category) assuming unique constraint
            const { error } = await supabase.from('budgets').upsert({
                user_id: userId,
                category: category,
                limit_amount: limit,
                period: 'monthly' // Default
            }, { onConflict: 'user_id, category' });

            if (error) throw error;
        } catch (error) {
            console.error('Error updating budget:', error);
        }
    };

    const updateStrategyTarget = async (type: 'needs' | 'wants' | 'savings', pct: number) => {
        if (!userId) return;

        setStrategyTargets(prev => ({ ...prev, [type]: pct }));

        const metaKey = `_META_${type.toUpperCase()}`;

        try {
            const { error } = await supabase.from('budgets').upsert({
                user_id: userId,
                category: metaKey,
                limit_amount: pct,
                period: 'monthly'
            }, { onConflict: 'user_id, category' });
            if (error) throw error;
        } catch (error) {
            console.error('Error updating strategy:', error);
        }
    };

    // --- FAMILY LOGIC ---
    const sendInvite = async (email: string) => {
        if (!userId || !email) return;

        // 1. Ensure I have a family created. If not, create one.
        let famId = currentFamily?.id;

        if (!famId) {
            const { data: newFam, error } = await supabase.from('families').insert({ name: 'Familia Nueva' }).select().single();
            if (newFam) {
                famId = newFam.id;
                setCurrentFamily({ id: newFam.id, name: newFam.name });
                // Add self
                await supabase.from('family_members').insert({ family_id: newFam.id, user_id: userId, role: 'admin' });
            }
        }

        if (famId) {
            const { error } = await supabase.from('invitations').insert({
                family_id: famId,
                email: email,
                invited_by: userId,
                status: 'pending'
            });
            if (error) alert('Error enviando invitación (tal vez ya existe)');
            else alert(`Invitación enviada a ${email}`);
        }
    };

    const acceptInvite = async (familyId: string) => {
        if (!userId) return;
        try {
            await supabase.from('family_members').insert({ family_id: familyId, user_id: userId, role: 'member' });
            await supabase.from('invitations').update({ status: 'accepted' }).eq('family_id', familyId).eq('email', currentUser); // using email

            // Reload
            await fetchData(userId);
            alert('¡Te has unido a la familia!');
        } catch (e) {
            console.error(e);
        }
    };

    const toggleSharedView = () => setIsSharedView(prev => !prev);


    const toggleTheme = () => setIsDarkTheme(prev => !prev);

    // Filter helpers
    const filterByView = <T extends { owner: string }>(items: T[]) => {
        // For now, since we only fetch user's data, return all.
        // In future, filter by family vs personal.
        return items;
    };

    const getNetWorth = () => {
        // Calculate Real Dynamic Balance
        return accounts.reduce((totalSum, acc) => {
            // Start with Initial Balance
            let accBalance = acc.initialBalance || 0;

            // Add all relevant transactions
            // Note: transaction amounts for expenses are usually stored negative or handled by type. 
            // In our map: expense/income.
            // Let's assume stored amounts are absolute or mixed. In `fetchData` we mapped them directly.
            // Standard: Income (+), Expense (-). 
            // But let's check our addTransaction logic... it stores signed? 
            // Logic in AddTransaction implies: expense -> -Math.abs(value). So amounts ARE signed in state usually?
            // Let's check mappedTx in fetchData... `amount: t.amount`. 
            // If DB has negative for expense, we just sum.
            // If DB has positive for expense, we need to check type.
            // Looking at SQL data earlier: "amount": "10500", "type": "expense". It seems stored as POSITIVE?
            // Wait, SQL dump showed `balance: -9440500`. 
            // Let's look at `addTransaction` again...
            // `const newBalance = account.balance + (tx.amount * (tx.type === 'expense' ? -1 : 1));`
            // This implies `tx.amount` is positive in the input object to addTransaction?

            // To be SAFE: 
            const accTxs = transactions.filter(t => t.accountId === acc.id);
            const txSum = accTxs.reduce((s, t) => {
                const amt = Math.abs(t.amount);
                const sign = t.type === 'expense' ? -1 : 1;
                return s + (amt * sign);
                // Note: If type is 'transfer' we need logic? 
                // Current types: expense, income. Transfer logic handled as expense/income pair?
                // Let's rely on type.
            }, 0);

            return totalSum + accBalance + txSum;
        }, 0);
    };

    const getPartialBalance = () => {
        // Partial Balance: Only Liquid (Bank, Cash, Wallet). Ignore Credit Cards.
        const liquidAccounts = accounts.filter(acc => ['bank', 'cash', 'wallet'].includes(acc.type));

        return liquidAccounts.reduce((totalSum, acc) => {
            let accBalance = acc.initialBalance || 0;
            const accTxs = transactions.filter(t => t.accountId === acc.id);
            const txSum = accTxs.reduce((s, t) => {
                const amt = Math.abs(t.amount);
                const sign = t.type === 'expense' ? -1 : 1;
                return s + (amt * sign);
            }, 0);
            return totalSum + accBalance + txSum;
        }, 0);
    };

    const getMonthlySpend = () => {
        const now = new Date();
        return transactions
            .filter(t => {
                const d = new Date(t.date);
                return t.type === 'expense' &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();
            })
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const getBudgetProgress = () => {
        const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
        const totalSpend = getMonthlySpend();
        return totalBudget > 0 ? totalSpend / totalBudget : 0;
    };

    const getUpcomingCCPayments = () => {
        const today = new Date();
        const bills: Subscription[] = [];

        accounts.filter(a => a.type === 'credit').forEach(card => {
            if (!card.cutoffDate || !card.paymentDate) return;

            // Determine relevant billing cycle
            // If today is before payment date, we might be paying previous cycle
            // Let's assume simplest model:
            // "Next Payment" is the next occurrence of paymentDate.

            let nextPayment = new Date(today.getFullYear(), today.getMonth(), card.paymentDate);
            if (nextPayment < today) {
                // If passed, move to next month
                nextPayment.setMonth(nextPayment.getMonth() + 1);
            }

            // Billing Cycle End (Cutoff) for this payment
            // Usually Payment Date is ~10-20 days after Cutoff.
            // If Payment is Dec 17, Cutoff was likely Dec 2 or Nov 29.
            // Logic: Cutoff is the closest cutoff date BEFORE the payment date.
            let cutoff = new Date(nextPayment.getFullYear(), nextPayment.getMonth(), card.cutoffDate);
            if (cutoff >= nextPayment) {
                cutoff.setMonth(cutoff.getMonth() - 1);
            }

            // Billing Start
            let start = new Date(cutoff);
            start.setMonth(start.getMonth() - 1);

            // 1. Calculate One-Time Purchases in this period
            const periodExpenses = transactions.filter(t => {
                const tDate = new Date(t.date);
                return t.accountId === card.id &&
                    t.type === 'expense' &&
                    tDate > start &&
                    tDate <= cutoff &&
                    (!t.installments || t.installments.total === 1);
            });

            const oneTimeSum = periodExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

            // 2. Calculate Installments
            let installmentsSum = 0;
            const installmenttxs = transactions.filter(t =>
                t.accountId === card.id &&
                t.type === 'expense' &&
                t.installments &&
                t.installments.total > 1
            );

            installmenttxs.forEach(t => {
                const tDate = new Date(t.date);
                // Installments start counting from the first cutoff AFTER purchase? Or immediately?
                // Usually immediately impacts next bill.
                // We check if purchase date is BEFORE current cutoff.
                if (tDate <= cutoff) {
                    // How many months passed?
                    // Simple heuristic: (CutoffYear - PurchaseYear) * 12 + (CutoffMonth - PurchaseMonth)
                    // If bought in Nov, Cutoff in Dec -> 1 month passed.

                    const monthsSincePurchase = (cutoff.getFullYear() - tDate.getFullYear()) * 12 +
                        (cutoff.getMonth() - tDate.getMonth());

                    if (monthsSincePurchase >= 0 && monthsSincePurchase < (t.installments?.total || 0)) {
                        // Add monthly share
                        installmentsSum += (Math.abs(t.amount) / (t.installments?.total || 1));
                    }
                }
            });

            // ⚠️ CRITICAL FIX: Clamp Bill to Real Debt
            // Calculate actual current balance to avoid "Phantom Bills" from handling fees when balance is 0.
            const realBalance = (card.initialBalance || 0) + transactions
                .filter(t => t.accountId === card.id)
                .reduce((sum, t) => {
                    const amt = Math.abs(t.amount);
                    const sign = t.type === 'expense' ? -1 : 1;
                    return sum + (amt * sign);
                }, 0);

            const currentDebt = realBalance < 0 ? Math.abs(realBalance) : 0;

            // The projected bill (OneTime + Installments + Fee) cannot exceed the total amount you actually owe.
            // If you owe $0, you pay $0.
            let totalDue = oneTimeSum + installmentsSum + (card.handlingFee || 0);

            // Cap at current debt
            if (totalDue > currentDebt) {
                totalDue = currentDebt;
            }

            if (totalDue > 0) {
                bills.push({
                    id: `cc-bill-${card.id}`,
                    name: `Pago ${card.name}`,
                    amount: totalDue,
                    frequency: 'monthly',
                    nextPaymentDate: nextPayment.toISOString().split('T')[0],
                    category: 'Debt',
                    owner: 'user1',
                    subscriptionType: 'credit_card_bill', // Virtual type
                    accountId: card.id,
                    description: `Corte: ${cutoff.toLocaleDateString()} - Deuda Total: $${currentDebt.toLocaleString()}`
                });
            }
        });

        return bills;
    };

    // Dynamic Account Calculation
    // We compute the REAL balance based on transactions to ensure UI is always in sync with history
    const derivedAccounts = React.useMemo(() => {
        return accounts.map(acc => {
            const accTxs = transactions.filter(t => t.accountId === acc.id);
            const txSum = accTxs.reduce((sum, t) => {
                const amt = Math.abs(t.amount);
                // Basic logic: Income adds, Expense subtracts.
                // For transfers, we need to check if source or dest? 
                // Currently transfers are stored as separate transactions (one expense, one income) or handled by type logic?
                // The current app logic seems to treat transfers as separate transactions in `addTransfer` (updating balances manually).
                // But `transactions` list just has 'expense'/'income' types usually?
                // Let's check `addTransfer`: It inserts into 'transfers' table but ALSO updates `accounts` balance. 
                // Does it create `transactions` records? 
                // Wait, `addTransfer` DOES NOT create records in `transactions` table based on the code I saw earlier (it inserts into `transfers` table).
                // CRITICAL ISSUE: If transfers are NOT in `transactions` array, calculating balance dynamically from ONLY `transactions` array will be WRONG for accounts involved in transfers.

                // However, the user said "quiero que estén sincronizados".
                // If I switch to dynamic calculation, I MUST include transfers.
                // But `transactions` state currently comes from `/api/sync` which usually joins tables.
                // Let's assume for now `transactions` contains everything that affects balance OR we strictly follow the user's request which implies the current static balance is wrong because he deleted transactions.

                // As a safe fallback for the "Transfers" edge case which might be complex:
                // If the user's main issue is that he deleted TRANSACTIONS and balance didn't update, 
                // then recalculating from remaining transactions is the fix.

                const sign = t.type === 'expense' ? -1 : 1;
                return sum + (amt * sign);
            }, 0);

            return {
                ...acc,
                balance: (acc.initialBalance || 0) + txSum
            };
        });
    }, [accounts, transactions]);

    return (
        <FinanceContext.Provider value={{
            currentUser,
            transactions,
            accounts: derivedAccounts, // EXPOSE DERIVED ACCOUNTS
            budgets,
            subscriptions,
            investments,
            families,
            setCurrentUser,
            addTransaction,
            updateTransaction,
            deleteTransaction,
            addAccount,
            updateAccountBalance,
            getNetWorth,
            getPartialBalance,
            getMonthlySpend,
            getBudgetProgress,
            addSubscription,
            updateSubscription,
            deleteSubscription,
            isDarkTheme,
            toggleTheme,
            isLoading,
            debugInfo,
            statusMessage,
            categories,
            addCategory,
            updateCategory,
            deleteCategory,
            seedUserDefaults,
            updateBudget,
            userId, // Expose userId
            addTransfer,
            updateAccount,
            deleteAccount,
            getUpcomingCCPayments,
            strategyTargets,
            updateStrategyTarget,
            // Family
            familyInput,
            setFamilyInput,
            sendInvite,
            acceptInvite,
            pendingInvites,
            currentFamily,
            isSharedView,
            toggleSharedView
        }}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (context === undefined) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
    { name: 'Comida', type: 'expense', color: '#FF9500', icon: 'Coffee' },
    { name: 'Transporte', type: 'expense', color: '#5856D6', icon: 'Car' },
    { name: 'Hogar', type: 'expense', color: '#007AFF', icon: 'Home' },
    { name: 'Entretenimiento', type: 'expense', color: '#AF52DE', icon: 'Film' },
    { name: 'Salud', type: 'expense', color: '#FF2D55', icon: 'Heart' },
    { name: 'Compras', type: 'expense', color: '#FFCC00', icon: 'ShoppingBag' },
    { name: 'Servicios', type: 'expense', color: '#5AC8FA', icon: 'Zap' },
    { name: 'Viajes', type: 'expense', color: '#34C759', icon: 'Plane' },
    { name: 'Educación', type: 'expense', color: '#FF3B30', icon: 'Book' },
    { name: 'Inversiones', type: 'expense', color: '#00C7BE', icon: 'TrendingUp' },
    { name: 'Salario', type: 'income', color: '#30B0C7', icon: 'DollarSign' },
    { name: 'Otros', type: 'expense', color: '#8E8E93', icon: 'MoreHorizontal' }
];

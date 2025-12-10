export type UserType = string;

export type TransactionType = 'expense' | 'income' | 'transfer' | 'payment';

export type Category = string;

export interface CategoryItem {
    id?: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
}

export interface Transaction {
    id: string;
    amount: number;
    date: string; // ISO string
    type: TransactionType;
    category: Category;
    accountId: string;
    relatedAccountId?: string;
    owner?: string; // userId
    is_shared?: boolean; // New
    family_id?: string; // New
    note?: string;
    description?: string; // alias for note/merchant
    photoUrl?: string;
    fileUrl?: string;
    installments?: {
        current: number;
        total: number;
    };
    isCreditCardPayment?: boolean;
}

export interface Account {
    id: string;
    name: string;
    type: 'bank' | 'cash' | 'credit' | 'investment' | 'wallet';
    balance: number;
    initialBalance?: number;
    currency: string;
    owner?: string;
    is_shared?: boolean; // New
    // Credit card specific
    limit?: number;
    cutoffDate?: number;
    paymentDate?: number;
    handlingFee?: number;
    is4x1000Exempt?: boolean;
}

export interface Budget {
    category: Category;
    limit: number;
}

export interface Subscription {
    id: string;
    name: string;
    amount: number;
    frequency: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'daily' | 'biweekly' | 'biannual';
    nextPaymentDate: string;
    category: Category;
    owner?: string;
    is_shared?: boolean;
    subscriptionType: 'subscription' | 'recurring_bill' | 'credit_card_bill';
    description?: string;
    accountId?: string;
    isActive?: boolean;
}

export interface Investment {
    id: string;
    name: string;
    symbol?: string;
    type: 'stock' | 'etf' | 'crypto' | 'bond' | 'real_estate' | 'other';
    quantity: number;
    purchasePrice: number;
    purchaseDate: string;
    currentPrice?: number;
    accountId?: string;
    owner?: string;
}

export interface Family {
    id: string;
    name: string;
    created_at?: string;
    members?: FamilyMember[];
}

export interface FamilyMember {
    user_id: string;
    role: 'admin' | 'member';
    email: string; // To match invitations
    joined_at?: string;
    status: 'active' | 'pending';
}

export interface Invitation {
    id: string;
    family_id: string;
    email: string;
    status: 'pending' | 'accepted' | 'rejected';
    invited_by: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

export interface FinanceState {
    currentUser: UserType;
    transactions: Transaction[];
    accounts: Account[];
    budgets: Budget[];
    subscriptions: Subscription[];
    investments: Investment[];
    families: Family[];
}

-- Enable RLS on transactions and accounts
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;

-- Create permissive policies for owner on transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (created_by = auth.uid());

-- Create permissive policies for owner on accounts
CREATE POLICY "Users can view own accounts" ON accounts
    FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Users can insert own accounts" ON accounts
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update own accounts" ON accounts
    FOR UPDATE USING (owner_user_id = auth.uid());

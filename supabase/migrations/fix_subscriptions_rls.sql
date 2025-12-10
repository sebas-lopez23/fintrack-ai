-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

-- Create permissive policies for owner
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions" ON subscriptions
    FOR DELETE USING (owner_user_id = auth.uid());

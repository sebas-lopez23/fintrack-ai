-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT,
    owner_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. View: Users can view system categories (owner_user_id IS NULL) AND their own categories
CREATE POLICY "Users can view system and own categories" ON categories
    FOR SELECT USING (
        owner_user_id IS NULL OR 
        owner_user_id = auth.uid() OR
        owner_user_id IN (
            SELECT user_id FROM family_members WHERE family_id IN (
                SELECT family_id FROM family_members WHERE user_id = auth.uid()
            )
        )
    );

-- 2. Insert: Users can insert their own categories
CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

-- 3. Update: Users can update their own categories
CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (owner_user_id = auth.uid());

-- 4. Delete: Users can delete their own categories
CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (owner_user_id = auth.uid());

-- Insert Default Categories (System)
INSERT INTO categories (name, type, icon, color) VALUES
    ('Food', 'expense', 'Coffee', '#FF9500'),
    ('Transport', 'expense', 'Car', '#5856D6'),
    ('Home', 'expense', 'Home', '#007AFF'),
    ('Entertainment', 'expense', 'Film', '#AF52DE'),
    ('Health', 'expense', 'Heart', '#FF2D55'),
    ('Shopping', 'expense', 'ShoppingBag', '#FFCC00'),
    ('Utilities', 'expense', 'Zap', '#5AC8FA'),
    ('Travel', 'expense', 'Plane', '#34C759'),
    ('Education', 'expense', 'Book', '#FF3B30'),
    ('Investment', 'expense', 'TrendingUp', '#00C7BE'),
    ('Salary', 'income', 'DollarSign', '#30B0C7'),
    ('Other', 'expense', 'MoreHorizontal', '#8E8E93')
ON CONFLICT DO NOTHING;

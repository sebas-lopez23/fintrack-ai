-- 1. Re-create categories table with strict ownership
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 3. Strict Policies (Only Owner Access)
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (owner_user_id = auth.uid());

-- 4. Function to initialize default categories for a user
CREATE OR REPLACE FUNCTION public.initialize_user_categories(target_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO categories (name, type, icon, color, owner_user_id) VALUES
    ('Comida', 'expense', 'Coffee', '#FF9500', target_user_id),
    ('Transporte', 'expense', 'Car', '#5856D6', target_user_id),
    ('Hogar', 'expense', 'Home', '#007AFF', target_user_id),
    ('Entretenimiento', 'expense', 'Film', '#AF52DE', target_user_id),
    ('Salud', 'expense', 'Heart', '#FF2D55', target_user_id),
    ('Compras', 'expense', 'ShoppingBag', '#FFCC00', target_user_id),
    ('Servicios', 'expense', 'Zap', '#5AC8FA', target_user_id),
    ('Viajes', 'expense', 'Plane', '#34C759', target_user_id),
    ('Educación', 'expense', 'Book', '#FF3B30', target_user_id),
    ('Inversiones', 'expense', 'TrendingUp', '#00C7BE', target_user_id),
    ('Salario', 'income', 'DollarSign', '#30B0C7', target_user_id),
    ('Otros', 'expense', 'MoreHorizontal', '#8E8E93', target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to auto-create categories for NEW users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.initialize_user_categories(new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. BACKFILL: Insert defaults for EXISTING users who have no categories
DO $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id FROM auth.users LOOP
        -- Check if user already has categories
        IF NOT EXISTS (SELECT 1 FROM categories WHERE owner_user_id = user_rec.id) THEN
            PERFORM public.initialize_user_categories(user_rec.id);
        END IF;
    END LOOP;
END $$;

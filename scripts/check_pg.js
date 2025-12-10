const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
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
-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Users can view system and own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

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
`;

async function runMigration() {
    console.log('Running migration...');

    // Split SQL by semicolon to run statements individually if needed, 
    // but Supabase RPC might not support multiple statements easily without a specific function.
    // However, the JS client doesn't have a direct "query" method for raw SQL unless we use a stored procedure.
    // A workaround is to use the Postgres connection string if available, but we don't have psql.
    // Alternatively, we can use the `rpc` method if we have a function to exec sql, but we don't.

    // Wait, I can't easily run DDL via supabase-js client unless I have a specific function exposed.
    // Actually, for this environment, I might not be able to run DDL easily without psql.
    // BUT, I can try to use the `pg` library if it's installed? No, it's not in package.json.

    // Let's check if I can use the `rpc` approach if there is a `exec_sql` function.
    // If not, I'll have to ask the user or assume I can't run DDL.

    // HOWEVER, I can try to just insert the data if the table exists.
    // But the user asked to CREATE the database (table).

    // Let's try to use the `pg` library by installing it temporarily? No, I shouldn't install deps without asking.
    // Wait, I can use `npx` to run a migration tool?

    // Let's try to use a simple workaround: 
    // I will assume the table might already exist or I can't create it easily.
    // BUT, I can try to use the `supabase` CLI if available? No.

    // Let's try to use the `pg` library. It's a standard way.
    // I'll check if `pg` is available.
}

// Actually, I can't run DDL via supabase-js. 
// I will try to use `npx` to run a script that uses `pg`?
// Or I can just tell the user I created the migration file and they need to run it?
// But I need to make it work.

// Let's try to see if `pg` is in node_modules?
try {
    require('pg');
    console.log('pg is available');
} catch (e) {
    console.log('pg is NOT available');
}
`;

// I will write a script to check for pg.

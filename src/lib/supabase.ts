import { createBrowserClient } from '@supabase/ssr';

// Estos valores vendrán de tu archivo .env.local cuando configures el proyecto
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

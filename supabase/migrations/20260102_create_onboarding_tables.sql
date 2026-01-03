-- Create user_onboarding table
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  welcome_carousel_completed BOOLEAN DEFAULT FALSE,
  categories_selected BOOLEAN DEFAULT FALSE,
  accounts_created BOOLEAN DEFAULT FALSE,
  transactions_imported BOOLEAN DEFAULT FALSE,
  dashboard_tour_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own onboarding"
  ON user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create default_categories table
CREATE TABLE IF NOT EXISTS default_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT CHECK (type IN ('expense', 'income')),
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default categories
INSERT INTO default_categories (name, icon, color, type, sort_order) VALUES
  ('Comida', '🍔', '#FF6B6B', 'expense', 1),
  ('Transporte', '🚗', '#4ECDC4', 'expense', 2),
  ('Hogar', '🏠', '#95E1D3', 'expense', 3),
  ('Entretenimiento', '🎬', '#F38181', 'expense', 4),
  ('Salud', '🏥', '#AA96DA', 'expense', 5),
  ('Educación', '📚', '#48C9B0', 'expense', 6),
  ('Compras', '🛍️', '#E056FD', 'expense', 7),
  ('Servicios', '⚡', '#FFA07A', 'expense', 8),
  ('Salario', '💰', '#4CAF50', 'income', 1),
  ('Inversiones', '📈', '#2196F3', 'income', 2)
ON CONFLICT DO NOTHING;

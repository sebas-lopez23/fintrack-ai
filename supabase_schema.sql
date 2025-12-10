-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type account_type as enum ('bank', 'cash', 'credit', 'investment', 'wallet');
create type transaction_type as enum ('income', 'expense', 'transfer', 'payment');
create type investment_type as enum ('stock', 'etf', 'crypto', 'bond', 'real_estate', 'other');
create type periodicity as enum ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'biannual', 'yearly');

-- 1. Perfiles de Usuario (Extiende la tabla auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Familias (Grupos compartidos)
create table public.families (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Miembros de Familia
create table public.family_members (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references public.families not null,
  user_id uuid references public.profiles not null,
  role text default 'member', -- 'admin', 'member'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(family_id, user_id)
);

-- 4. Cuentas Financieras
create table public.accounts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type account_type not null,
  balance numeric default 0, -- Saldo actual (incluye deuda para tarjetas)
  initial_balance numeric default 0,
  currency text default 'COP',
  
  -- Propiedad
  owner_user_id uuid references public.profiles,
  owner_family_id uuid references public.families,
  
  -- Datos extra para tarjetas de crédito
  credit_limit numeric,
  cutoff_day integer, -- Día de corte (1-31)
  payment_day integer, -- Día límite de pago (1-31)
  interest_rate numeric, -- Tasa de interés (E.A. o mensual según convención)
  handling_fee numeric default 0, -- Cuota de manejo
  
  -- Datos extra para cuentas bancarias
  is_4x1000_exempt boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint owner_check check (
    (owner_user_id is not null and owner_family_id is null) or
    (owner_user_id is null and owner_family_id is not null)
  )
);

-- 5. Transacciones
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references public.accounts not null,
  amount numeric not null,
  type transaction_type not null,
  category text not null,
  description text,
  date timestamp with time zone not null,
  
  -- Transferencias / Pagos de Tarjeta
  related_account_id uuid references public.accounts, -- Cuenta destino (transferencia) o cuenta origen (pago tarjeta)
  
  -- Cuotas (Tarjeta de Crédito)
  installments_current integer,
  installments_total integer,
  
  -- Adjuntos
  attachments text[], -- Array de URLs de archivos
  
  created_by uuid references public.profiles not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Suscripciones y Pagos Recurrentes
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  amount numeric not null,
  currency text default 'COP',
  periodicity periodicity not null,
  start_date date not null,
  next_payment_date date,
  
  account_id uuid references public.accounts, -- Medio de pago por defecto
  category text,
  
  owner_user_id uuid references public.profiles,
  owner_family_id uuid references public.families,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Inversiones
create table public.investments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  symbol text, -- Ej: AAPL, VO
  type investment_type not null,
  
  quantity numeric not null,
  purchase_price numeric not null, -- Precio unitario de compra
  purchase_date timestamp with time zone not null,
  
  current_price numeric, -- Valor actual (actualizable por API)
  last_price_update timestamp with time zone,
  
  account_id uuid references public.accounts, -- Origen de los fondos
  
  owner_user_id uuid references public.profiles,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Historial de Chat (IA)
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles not null,
  role text not null, -- 'user', 'assistant'
  content text not null,
  conversation_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) - Habilitar seguridad
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.investments enable row level security;
alter table public.chat_messages enable row level security;

-- Políticas básicas (Ejemplos)
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

create policy "Users can view own or family accounts" on public.accounts for select using (
  owner_user_id = auth.uid() or
  owner_family_id in (select family_id from public.family_members where user_id = auth.uid())
);

create policy "Users can view transactions of accessible accounts" on public.transactions for select using (
  account_id in (
    select id from public.accounts where 
    owner_user_id = auth.uid() or
    owner_family_id in (select family_id from public.family_members where user_id = auth.uid())
  )
);

-- Migration: payment history sync + new debt fields
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).

-- 1. New debt fields (tenor, prior payments, provider link)
alter table public.debts add column if not exists tenor_months integer;
alter table public.debts add column if not exists prior_payments integer;
alter table public.debts add column if not exists provider_id text;

-- 2. Payment records table (one row per debt per month)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  debt_local_id bigint not null,
  month text not null, -- "YYYY-MM"
  amount numeric not null default 0,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, debt_local_id, month)
);

-- 3. Row Level Security: users can only touch their own payments
alter table public.payments enable row level security;

create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

create policy "payments_insert_own" on public.payments
  for insert with check (auth.uid() = user_id);

create policy "payments_update_own" on public.payments
  for update using (auth.uid() = user_id);

create policy "payments_delete_own" on public.payments
  for delete using (auth.uid() = user_id);

-- 4. Helpful index for the sync queries
create index if not exists payments_user_debt_idx
  on public.payments (user_id, debt_local_id);

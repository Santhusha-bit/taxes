-- ============================================================
-- TaxWise Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users table (extends Supabase auth.users) ────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  name          text not null default '',
  age           integer,
  filing_status text not null default 'single'
                  check (filing_status in ('single','married_jointly','head')),
  state         text not null default 'CA',
  annual_income numeric(12,2) not null default 0,
  employer_plan boolean not null default false,
  k401          numeric(12,2) not null default 0,
  hsa           numeric(12,2) not null default 0,
  ira_contrib   numeric(12,2) not null default 0,
  roth_contrib  numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Transactions table ───────────────────────────────────────
create table public.transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null check (type in ('income','expense')),
  date        date,
  description text not null,
  amount      numeric(12,2) not null check (amount >= 0),
  category    text not null,
  note        text,
  created_at  timestamptz not null default now()
);

-- ── Chat history table ───────────────────────────────────────
create table public.chat_messages (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.transactions  enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Transactions: users can only see/edit their own
create policy "Users can view own transactions"
  on public.transactions for select using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert with check (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete using (auth.uid() = user_id);

-- Chat: users can only see/edit their own
create policy "Users can view own chat"
  on public.chat_messages for select using (auth.uid() = user_id);

create policy "Users can insert own chat"
  on public.chat_messages for insert with check (auth.uid() = user_id);

create policy "Users can delete own chat"
  on public.chat_messages for delete using (auth.uid() = user_id);

-- ── Auto-update updated_at ───────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();

-- ── Auto-create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Indexes for performance ───────────────────────────────────
create index transactions_user_id_idx on public.transactions(user_id);
create index transactions_created_at_idx on public.transactions(created_at desc);
create index chat_messages_user_id_idx on public.chat_messages(user_id);
create index chat_messages_created_at_idx on public.chat_messages(created_at asc);

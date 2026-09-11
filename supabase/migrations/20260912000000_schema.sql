create extension if not exists "uuid-ossp";

create table wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  "name" text not null,
  "account" text not null default '',
  color text not null default '#2563eb',
  created_at timestamp default now()
);

create table income_types (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  "name" text not null,
  allocations jsonb not null default '{}'::jsonb,
  created_at timestamp default now()
);

create table ledger_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  "date" date not null,
  "note" text not null default '',
  wallet_id uuid references wallets not null,
  kind text not null check (kind in ('income', 'expense', 'transfer-out', 'transfer-in')),
  amount bigint not null,
  group_id uuid,
  income_type_id uuid references income_types
);

create table allocation_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  "date" date not null,
  income_type_id uuid references income_types not null,
  amount bigint not null,
  group_id uuid not null
);

create table transfers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  "date" date not null,
  note text not null default '',
  from_wallet_id uuid references wallets not null,
  to_wallet_id uuid references wallets not null,
  amount bigint not null
);

create index on wallets (user_id);
create index on income_types (user_id);
create index on ledger_entries (user_id, "date");
create index on allocation_logs (user_id);
create index on transfers (user_id);

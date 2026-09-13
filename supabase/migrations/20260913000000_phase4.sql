-- Phase 4: wallet targets, nullable debt payment wallet, and assets

create table wallet_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  wallet_id uuid references wallets on delete cascade not null,
  target_amount bigint not null check (target_amount > 0),
  unique (user_id, wallet_id)
);

create index on wallet_targets (user_id);
alter table wallet_targets enable row level security;
create policy "Users manage own rows" on wallet_targets
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Make wallet_id nullable on debt_payments to support payments outside wallets
alter table debt_payments alter column wallet_id drop not null;

-- Assets table
create table assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  category text not null,
  buy_price bigint not null check (buy_price > 0),
  current_price bigint not null check (current_price >= 0),
  sell_price bigint check (sell_price is null or sell_price >= 0),
  buy_date date not null,
  sell_date date,
  status text not null default 'active' check (status in ('active', 'sold')),
  buy_wallet_id uuid references wallets on delete set null,
  sell_wallet_id uuid references wallets on delete set null,
  note text not null default '',
  created_at timestamp default now()
);

create index on assets (user_id);
alter table assets enable row level security;
create policy "Users manage own rows" on assets
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

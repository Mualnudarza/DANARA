create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  direction text not null check (direction in ('owe', 'owed')),
  initial_amount bigint not null check (initial_amount > 0),
  note text not null default '',
  status text not null default 'active' check (status in ('active', 'paid')),
  created_at timestamp default now()
);

create table debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  debt_id uuid references debts on delete cascade not null,
  date date not null,
  amount bigint not null check (amount > 0),
  wallet_id uuid references wallets not null,
  note text not null default ''
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  wallet_id uuid references wallets on delete cascade not null,
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  limit_amount bigint not null check (limit_amount > 0),
  unique (user_id, wallet_id, month)
);

create index on debts (user_id);
create index on debt_payments (user_id, debt_id);
create index on budgets (user_id, month);

alter table debts enable row level security;
alter table debt_payments enable row level security;
alter table budgets enable row level security;

create policy "Users manage own rows" on debts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own rows" on debt_payments
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own rows" on budgets
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

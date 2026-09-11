alter table wallets enable row level security;
alter table income_types enable row level security;
alter table ledger_entries enable row level security;
alter table allocation_logs enable row level security;
alter table transfers enable row level security;

drop policy if exists "Users manage own rows" on wallets;
drop policy if exists "Users manage own rows" on income_types;
drop policy if exists "Users manage own rows" on ledger_entries;
drop policy if exists "Users manage own rows" on allocation_logs;
drop policy if exists "Users manage own rows" on transfers;

create policy "Users manage own rows" on wallets
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own rows" on income_types
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own rows" on ledger_entries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own rows" on allocation_logs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own rows" on transfers
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

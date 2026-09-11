-- Validate allocation percentages sum to 100.
create or replace function public.validate_allocation(alloc jsonb)
returns boolean language immutable strict as $$
  select sum((value->>'percent')::int) = 100 from jsonb_each(alloc)
$$;

-- Split income amount into per-wallet allocations.
create or replace function public.split_income(amount bigint, income_type_id uuid)
returns table(wallet_id uuid, amount bigint) language plpgsql as
$$
declare
  alloc jsonb;
begin
  alloc := (select allocations from income_types where id = income_type_id);
  return query
    select wallet_id::uuid, floor(amount * (value->>'percent')::int / 100)::bigint
    from jsonb_each(alloc);
end;
$$;

-- Wallet balance computed from ledger (immutable view).
create or replace view public.wallet_balances as
  select wallet_id, sum(
    case kind
      when 'income' then amount
      when 'expense', 'transfer-out' then -amount
      when 'transfer-in' then amount
      else 0
    end
  ) as balance
  from public.ledger_entries
  group by wallet_id;

-- Net wallet balance for a single user.
create or replace function public.user_balances(uid uuid)
returns table(wallet_id uuid, balance bigint) language sql as
$$
  select l.wallet_id,
    sum(case
      when l.kind in ('expense', 'transfer-out') then -l.amount
      else l.amount
    end) as balance
  from public.ledger_entries l
  join wallets w on w.id = l.wallet_id
  where w.user_id = uid
  group by l.wallet_id
$$;

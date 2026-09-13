import { createClient } from "@supabase/supabase-js";
import type { FinanceData } from "./types";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export async function loadFinanceData(): Promise<FinanceData> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Sesi pengguna hilang.");
  const [
    { data: wallets },
    { data: walletTargets },
    { data: incomeTypes },
    { data: entries },
    { data: allocations },
    { data: debts },
    { data: debtPayments },
    { data: assets },
  ] = await Promise.all([
    supabase.from("wallets").select().order("name"),
    supabase.from("wallet_targets").select(),
    supabase.from("income_types").select(),
    supabase.from("ledger_entries").select(),
    supabase.from("allocation_logs").select(),
    supabase.from("debts").select().order("created_at"),
    supabase.from("debt_payments").select(),
    supabase.from("assets").select().order("created_at", { ascending: false }),
  ]);
  return {
    wallets: (wallets ?? []).map((wallet) => ({ id: wallet.id, name: wallet.name, account: wallet.account, color: wallet.color })),
    walletTargets: (walletTargets ?? []).map((target) => ({ id: target.id, walletId: target.wallet_id, targetAmount: Number(target.target_amount) })),
    incomeTypes: (incomeTypes ?? []).map((type) => ({ id: type.id, name: type.name, allocations: type.allocations as Record<string, number> })),
    entries: (entries ?? []).map((entry) => ({ id: entry.id, date: entry.date, note: entry.note, walletId: entry.wallet_id, kind: entry.kind, amount: Number(entry.amount), groupId: entry.group_id, incomeTypeId: entry.income_type_id })),
    allocations: (allocations ?? []).map((log) => ({ id: log.id, date: log.date, incomeTypeId: log.income_type_id, amount: Number(log.amount), groupId: log.group_id })),
    debts: (debts ?? []).map((debt) => ({ id: debt.id, name: debt.name, direction: debt.direction, initialAmount: Number(debt.initial_amount), note: debt.note, status: debt.status })),
    debtPayments: (debtPayments ?? []).map((payment) => ({ id: payment.id, debtId: payment.debt_id, date: payment.date, amount: Number(payment.amount), walletId: payment.wallet_id ?? undefined, note: payment.note })),
    assets: (assets ?? []).map((asset) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      buyPrice: Number(asset.buy_price),
      currentPrice: Number(asset.current_price),
      sellPrice: asset.sell_price != null ? Number(asset.sell_price) : undefined,
      buyDate: asset.buy_date,
      sellDate: asset.sell_date ?? undefined,
      status: asset.status,
      buyWalletId: asset.buy_wallet_id ?? undefined,
      sellWalletId: asset.sell_wallet_id ?? undefined,
      note: asset.note ?? "",
    })),
  };
}

export async function upsertFinanceData(data: FinanceData) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Sesi pengguna hilang.");
  const insertWallets = data.wallets.map((wallet) => ({ id: wallet.id, user_id: user.id, name: wallet.name, account: wallet.account, color: wallet.color }));
  const insertWalletTargets = data.walletTargets.map((target) => ({ id: target.id, user_id: user.id, wallet_id: target.walletId, target_amount: target.targetAmount }));
  const insertTypes = data.incomeTypes.map((type) => ({ id: type.id, user_id: user.id, name: type.name, allocations: type.allocations }));
  const insertEntries = data.entries.map((entry) => ({ id: entry.id, user_id: user.id, date: entry.date, note: entry.note, wallet_id: entry.walletId, kind: entry.kind, amount: entry.amount, group_id: entry.groupId ?? null, income_type_id: entry.incomeTypeId ?? null }));
  const insertLogs = data.allocations.map((log) => ({ id: log.id, user_id: user.id, date: log.date, income_type_id: log.incomeTypeId, amount: log.amount, group_id: log.groupId }));
  const insertDebts = data.debts.map((debt) => ({ id: debt.id, user_id: user.id, name: debt.name, direction: debt.direction, initial_amount: debt.initialAmount, note: debt.note, status: debt.status }));
  const insertDebtPayments = data.debtPayments.map((payment) => ({ id: payment.id, user_id: user.id, debt_id: payment.debtId, date: payment.date, amount: payment.amount, wallet_id: payment.walletId ?? null, note: payment.note }));
  const insertAssets = data.assets.map((asset) => ({
    id: asset.id,
    user_id: user.id,
    name: asset.name,
    category: asset.category,
    buy_price: asset.buyPrice,
    current_price: asset.currentPrice,
    sell_price: asset.sellPrice ?? null,
    buy_date: asset.buyDate,
    sell_date: asset.sellDate ?? null,
    status: asset.status,
    buy_wallet_id: asset.buyWalletId ?? null,
    sell_wallet_id: asset.sellWalletId ?? null,
    note: asset.note,
  }));
  const insertTransfers = data.entries.filter((entry) => entry.kind === "transfer-out").map((entry) => {
    const dest = data.entries.find((other) => other.groupId === entry.groupId && other.kind === "transfer-in");
    return { group_id: entry.groupId, date: entry.date, note: entry.note, from_wallet_id: entry.walletId, to_wallet_id: dest?.walletId ?? "", amount: entry.amount };
  });
  await Promise.all([
    supabase.from("wallets").upsert(insertWallets),
    supabase.from("wallet_targets").upsert(insertWalletTargets),
    supabase.from("income_types").upsert(insertTypes),
    supabase.from("ledger_entries").upsert(insertEntries),
    supabase.from("allocation_logs").upsert(insertLogs),
    supabase.from("debts").upsert(insertDebts),
    supabase.from("debt_payments").upsert(insertDebtPayments),
    supabase.from("assets").upsert(insertAssets),
  ]);
  for (const transfer of insertTransfers) {
    await supabase.from("transfers").upsert({ id: transfer.group_id, user_id: user.id, ...transfer });
  }
}

import { createClient } from "@supabase/supabase-js";
import type { FinanceData } from "./types";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export async function loadFinanceData(): Promise<FinanceData> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Sesi pengguna hilang.");
  const [{ data: wallets }, { data: incomeTypes }, { data: entries }, { data: allocations }] = await Promise.all([
    supabase.from("wallets").select().order("name"),
    supabase.from("income_types").select(),
    supabase.from("ledger_entries").select(),
    supabase.from("allocation_logs").select(),
  ]);
  return {
    wallets: (wallets ?? []).map((wallet) => ({ id: wallet.id, name: wallet.name, account: wallet.account, color: wallet.color })),
    incomeTypes: (incomeTypes ?? []).map((type) => ({ id: type.id, name: type.name, allocations: type.allocations as Record<string, number> })),
    entries: (entries ?? []).map((entry) => ({ id: entry.id, date: entry.date, note: entry.note, walletId: entry.wallet_id, kind: entry.kind, amount: Number(entry.amount), groupId: entry.group_id, incomeTypeId: entry.income_type_id })),
    allocations: (allocations ?? []).map((log) => ({ id: log.id, date: log.date, incomeTypeId: log.income_type_id, amount: Number(log.amount), groupId: log.group_id })),
  };
}

export async function upsertFinanceData(data: FinanceData) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Sesi pengguna hilang.");
  const insertWallets = data.wallets.map((wallet) => ({ id: wallet.id, user_id: user.id, name: wallet.name, account: wallet.account, color: wallet.color }));
  const insertTypes = data.incomeTypes.map((type) => ({ id: type.id, user_id: user.id, name: type.name, allocations: type.allocations }));
  const insertEntries = data.entries.map((entry) => ({ id: entry.id, user_id: user.id, date: entry.date, note: entry.note, wallet_id: entry.walletId, kind: entry.kind, amount: entry.amount, group_id: entry.groupId ?? null, income_type_id: entry.incomeTypeId ?? null }));
  const insertLogs = data.allocations.map((log) => ({ id: log.id, user_id: user.id, date: log.date, income_type_id: log.incomeTypeId, amount: log.amount, group_id: log.groupId }));
  const insertTransfers = data.entries.filter((entry) => entry.kind === "transfer-out").map((entry) => {
    const dest = data.entries.find((other) => other.groupId === entry.groupId && other.kind === "transfer-in");
    return { group_id: entry.groupId, date: entry.date, note: entry.note, from_wallet_id: entry.walletId, to_wallet_id: dest?.walletId ?? "", amount: entry.amount };
  });
  await Promise.all([
    supabase.from("wallets").upsert(insertWallets),
    supabase.from("income_types").upsert(insertTypes),
    supabase.from("ledger_entries").upsert(insertEntries),
    supabase.from("allocation_logs").upsert(insertLogs),
  ]);
  for (const transfer of insertTransfers) {
    await supabase.from("transfers").upsert({ id: transfer.group_id, user_id: user.id, ...transfer });
  }
}

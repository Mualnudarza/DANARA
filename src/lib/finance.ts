import type { IncomeType, LedgerEntry, Summary, Wallet } from "./types";

export const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function allocationTotal(incomeType: IncomeType) {
  return Object.values(incomeType.allocations).reduce((sum, value) => sum + value, 0);
}

export function isValidAllocation(incomeType: IncomeType) {
  return allocationTotal(incomeType) === 100;
}

export function splitIncome(amount: number, incomeType: IncomeType) {
  const valid = isValidAllocation(incomeType);
  if (!valid || !Number.isSafeInteger(amount) || amount <= 0) throw new Error("Alokasi atau nominal tidak valid.");

  const items = Object.entries(incomeType.allocations).filter(([, percentage]) => percentage > 0);
  let assigned = 0;
  return items.map(([walletId, percentage], index) => {
    const value = index === items.length - 1 ? amount - assigned : Math.floor((amount * percentage) / 100);
    assigned += value;
    return { walletId, amount: value };
  });
}

export function entryNet(entry: LedgerEntry) {
  return entry.kind === "expense" || entry.kind === "transfer-out" ? -entry.amount : entry.amount;
}

export function calculateBalances(wallets: Wallet[], entries: LedgerEntry[]) {
  const balances = Object.fromEntries(wallets.map((wallet) => [wallet.id, 0])) as Record<string, number>;
  entries.forEach((entry) => {
    if (entry.walletId in balances) balances[entry.walletId] += entryNet(entry);
  });
  return balances;
}

export function dashboardSummary(wallets: Wallet[], entries: LedgerEntry[], now = new Date()): Summary {
  const month = now.toISOString().slice(0, 7);
  const balances = calculateBalances(wallets, entries);
  const current = entries.filter((entry) => entry.date.startsWith(month));
  return {
    balances,
    totalBalance: Object.values(balances).reduce((sum, amount) => sum + amount, 0),
    monthIncome: current.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0),
    monthExpense: current.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0),
  };
}

export function newTransfer(fromWalletId: string, toWalletId: string, amount: number, date: string, note: string): LedgerEntry[] {
  if (fromWalletId === toWalletId || amount <= 0 || !Number.isSafeInteger(amount)) throw new Error("Transfer tidak valid.");
  const groupId = crypto.randomUUID();
  return [
    { id: crypto.randomUUID(), date, note, walletId: fromWalletId, kind: "transfer-out", amount, groupId },
    { id: crypto.randomUUID(), date, note, walletId: toWalletId, kind: "transfer-in", amount, groupId },
  ];
}

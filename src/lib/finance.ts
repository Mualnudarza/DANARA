import type { Asset, DayAggregate, Debt, DebtPayment, IncomeType, LedgerEntry, Summary, Wallet, WalletTarget } from "./types";

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

export function targetProgress(balance: number, target: number) {
  if (target <= 0) throw new Error("Target harus lebih dari nol.");
  const pct = Math.round((balance / target) * 100);
  return {
    pct: Math.max(0, Math.min(100, pct)),
    rawPct: pct,
    remaining: Math.max(0, target - balance),
    reached: balance >= target,
  };
}

export function walletTargetLookup(targets: WalletTarget[]) {
  return Object.fromEntries(targets.map((t) => [t.walletId, t.targetAmount])) as Record<string, number>;
}

export function debtRemaining(debt: Debt, payments: DebtPayment[]) {
  const paid = payments.filter((payment) => payment.debtId === debt.id).reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(0, debt.initialAmount - paid);
}

export function debtTotals(debts: Debt[], payments: DebtPayment[]) {
  const remaining = (direction: Debt["direction"]) =>
    debts.filter((debt) => debt.direction === direction && debt.status === "active").reduce((sum, debt) => sum + debtRemaining(debt, payments), 0);
  const owe = remaining("owe");
  const owed = remaining("owed");
  return { owe, owed, net: owed - owe };
}

export function assetValue(asset: Asset) {
  if (asset.status === "sold") return asset.sellPrice ?? asset.currentPrice;
  return asset.currentPrice;
}

export function assetPL(asset: Asset) {
  const value = assetValue(asset);
  const diff = value - asset.buyPrice;
  const pct = asset.buyPrice > 0 ? Math.round((diff / asset.buyPrice) * 100) : 0;
  return { value, diff, pct, isProfit: diff >= 0 };
}

export function activeAssetsTotal(assets: Asset[]) {
  return assets.filter((a) => a.status === "active").reduce((sum, a) => sum + a.currentPrice, 0);
}

export function groupByDay(entries: LedgerEntry[], year: number, month: number): Record<string, DayAggregate> {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const days: Record<string, DayAggregate> = {};
  entries
    .filter((entry) => entry.date.startsWith(prefix))
    .forEach((entry) => {
      const day = (days[entry.date] ??= { income: 0, expense: 0, count: 0, hasTransfer: false });
      if (entry.kind === "income") day.income += entry.amount;
      else if (entry.kind === "expense") day.expense += entry.amount;
      else day.hasTransfer = true;
      day.count += 1;
    });
  return days;
}

export function newTransfer(fromWalletId: string, toWalletId: string, amount: number, date: string, note: string): LedgerEntry[] {
  if (fromWalletId === toWalletId || amount <= 0 || !Number.isSafeInteger(amount)) throw new Error("Transfer tidak valid.");
  const groupId = crypto.randomUUID();
  return [
    { id: crypto.randomUUID(), date, note, walletId: fromWalletId, kind: "transfer-out", amount, groupId },
    { id: crypto.randomUUID(), date, note, walletId: toWalletId, kind: "transfer-in", amount, groupId },
  ];
}

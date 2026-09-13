import { describe, expect, it } from "vitest";
import { activeAssetsTotal, assetPL, calculateBalances, debtRemaining, debtTotals, groupByDay, isValidAllocation, newTransfer, splitIncome, targetProgress, walletTargetLookup } from "./finance";
import type { Asset, Debt, DebtPayment, IncomeType, LedgerEntry, Wallet, WalletTarget } from "./types";

const wallets: Wallet[] = [{ id: "a", name: "A", account: "BCA", color: "#000" }, { id: "b", name: "B", account: "BCA", color: "#111" }];
const incomeType: IncomeType = { id: "salary", name: "Salary", allocations: { a: 33, b: 67 } };

describe("finance", () => {
  it("membagi uang bulat dengan sisa ke alokasi terakhir", () => {
    const split = splitIncome(101, incomeType);
    expect(split).toEqual([{ walletId: "a", amount: 33 }, { walletId: "b", amount: 68 }]);
    expect(split.reduce((sum, item) => sum + item.amount, 0)).toBe(101);
  });
  it("menolak total alokasi selain 100 persen", () => {
    expect(isValidAllocation({ ...incomeType, allocations: { a: 50, b: 49 } })).toBe(false);
  });
  it("menghitung sisa hutang dan total dua arah", () => {
    const debts: Debt[] = [
      { id: "d1", name: "Budi", direction: "owe", initialAmount: 1000, note: "", status: "active" },
      { id: "d2", name: "Sinta", direction: "owed", initialAmount: 600, note: "", status: "active" },
    ];
    const payments: DebtPayment[] = [{ id: "p1", debtId: "d1", date: "2026-09-01", amount: 400, walletId: "a", note: "" }];
    expect(debtRemaining(debts[0], payments)).toBe(600);
    expect(debtTotals(debts, payments)).toEqual({ owe: 600, owed: 600, net: 0 });
  });
  it("menghitung progres target dompet", () => {
    expect(targetProgress(900_000, 1_200_000)).toEqual({ pct: 75, rawPct: 75, remaining: 300_000, reached: false });
    expect(targetProgress(1_500_000, 1_200_000)).toEqual({ pct: 100, rawPct: 125, remaining: 0, reached: true });
    expect(targetProgress(0, 500_000)).toEqual({ pct: 0, rawPct: 0, remaining: 500_000, reached: false });
  });
  it("lookup target per wallet", () => {
    const targets: WalletTarget[] = [
      { id: "t1", walletId: "a", targetAmount: 1_000_000 },
      { id: "t2", walletId: "b", targetAmount: 2_000_000 },
    ];
    expect(walletTargetLookup(targets)).toEqual({ a: 1_000_000, b: 2_000_000 });
  });
  it("menghitung untung rugi aset aktif dan terjual", () => {
    const activeGold: Asset = {
      id: "as1",
      name: "Emas Antam 10g",
      category: "emas",
      buyPrice: 10_000_000,
      currentPrice: 12_500_000,
      buyDate: "2026-01-01",
      status: "active",
      note: "",
    };
    expect(assetPL(activeGold)).toEqual({ value: 12_500_000, diff: 2_500_000, pct: 25, isProfit: true });

    const soldStock: Asset = {
      id: "as2",
      name: "BBCA",
      category: "saham",
      buyPrice: 5_000_000,
      currentPrice: 5_000_000,
      sellPrice: 4_500_000,
      buyDate: "2026-02-01",
      sellDate: "2026-09-01",
      status: "sold",
      note: "",
    };
    expect(assetPL(soldStock)).toEqual({ value: 4_500_000, diff: -500_000, pct: -10, isProfit: false });
    expect(activeAssetsTotal([activeGold, soldStock])).toBe(12_500_000);
  });
  it("mengelompokkan transaksi per hari tanpa parsing zona waktu", () => {
    const entries = [
      { id: "e1", date: "2026-09-05", note: "", walletId: "a", kind: "income", amount: 100 },
      { id: "e2", date: "2026-09-05", note: "", walletId: "a", kind: "expense", amount: 40 },
      { id: "e3", date: "2026-09-06", note: "", walletId: "b", kind: "transfer-out", amount: 10 },
    ] as LedgerEntry[];
    expect(groupByDay(entries, 2026, 8)).toEqual({
      "2026-09-05": { income: 100, expense: 40, count: 2, hasTransfer: false },
      "2026-09-06": { income: 0, expense: 0, count: 1, hasTransfer: true },
    });
  });
  it("mencatat transfer sebagai pasangan net-zero", () => {
    const entries = newTransfer("a", "b", 50, "2026-09-11", "test");
    const balances = calculateBalances(wallets, entries);
    expect(balances).toEqual({ a: -50, b: 50 });
    expect(balances.a + balances.b).toBe(0);
  });
});

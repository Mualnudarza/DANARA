import { describe, expect, it } from "vitest";
import { budgetSpent, budgetStatus, calculateBalances, debtRemaining, debtTotals, groupByDay, isValidAllocation, newTransfer, splitIncome } from "./finance";
import type { Debt, DebtPayment, IncomeType, LedgerEntry, Wallet } from "./types";

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
  it("menilai status budget aman, waspada, dan jebol", () => {
    expect(budgetStatus(2000, 1000).status).toBe("safe");
    expect(budgetStatus(2000, 1700).status).toBe("warning");
    expect(budgetStatus(2000, 2200)).toMatchObject({ status: "over", remaining: -200 });
  });
  it("menjumlahkan pengeluaran dompet per bulan", () => {
    const entries = [
      { id: "e1", date: "2026-09-05", note: "", walletId: "a", kind: "expense", amount: 300 },
      { id: "e2", date: "2026-08-05", note: "", walletId: "a", kind: "expense", amount: 900 },
    ] as LedgerEntry[];
    expect(budgetSpent(entries, "a", "2026-09")).toBe(300);
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

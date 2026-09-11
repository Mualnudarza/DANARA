import { describe, expect, it } from "vitest";
import { calculateBalances, isValidAllocation, newTransfer, splitIncome } from "./finance";
import type { IncomeType, Wallet } from "./types";

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
  it("mencatat transfer sebagai pasangan net-zero", () => {
    const entries = newTransfer("a", "b", 50, "2026-09-11", "test");
    const balances = calculateBalances(wallets, entries);
    expect(balances).toEqual({ a: -50, b: 50 });
    expect(balances.a + balances.b).toBe(0);
  });
});

import type { FinanceData } from "./types";

export const initialFinanceData: FinanceData = {
  wallets: [
    { id: "w-cash", name: "Tunai / Dompet", account: "Cash", color: "#10b981" },
    { id: "w-bank", name: "Rekening Utama", account: "Bank", color: "#3b82f6" },
  ],
  walletTargets: [],
  incomeTypes: [{ id: "it-main", name: "Pemasukan / Gaji", allocations: { "w-cash": 30, "w-bank": 70 } }],
  entries: [],
  allocations: [],
  debts: [],
  debtPayments: [],
  assets: [],
};

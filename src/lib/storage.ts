import type { FinanceData } from "./types";

const STORAGE_KEY = "danara_finance_data_v1";

export const initialFinanceData: FinanceData = {
  wallets: [
    { id: "w-cash", name: "Tunai / Dompet", account: "Cash", color: "#10b981" },
    { id: "w-bank", name: "Rekening Utama", account: "Bank", color: "#3b82f6" },
  ],
  walletTargets: [],
  incomeTypes: [
    {
      id: "it-main",
      name: "Pemasukan / Gaji",
      allocations: { "w-cash": 30, "w-bank": 70 },
    },
  ],
  entries: [],
  allocations: [],
  debts: [],
  debtPayments: [],
  assets: [],
};

export function loadLocalData(): FinanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialFinanceData;
    const parsed = JSON.parse(raw) as Partial<FinanceData>;
    return {
      wallets: parsed.wallets ?? initialFinanceData.wallets,
      walletTargets: parsed.walletTargets ?? [],
      incomeTypes: parsed.incomeTypes ?? initialFinanceData.incomeTypes,
      entries: parsed.entries ?? [],
      allocations: parsed.allocations ?? [],
      debts: parsed.debts ?? [],
      debtPayments: parsed.debtPayments ?? [],
      assets: parsed.assets ?? [],
    };
  } catch {
    return initialFinanceData;
  }
}

export function saveLocalData(data: FinanceData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ponytail: local storage quota error handled silently; add alert if payload exceeds 5MB
  }
}

export function clearLocalData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

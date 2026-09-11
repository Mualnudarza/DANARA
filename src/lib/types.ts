export type EntryKind = "income" | "expense" | "transfer-in" | "transfer-out";

export interface Wallet {
  id: string;
  name: string;
  account: string;
  color: string;
}

export interface IncomeType {
  id: string;
  name: string;
  allocations: Record<string, number>;
}

export interface LedgerEntry {
  id: string;
  date: string;
  note: string;
  walletId: string;
  kind: EntryKind;
  amount: number;
  groupId?: string;
  incomeTypeId?: string;
}

export interface AllocationLog {
  id: string;
  date: string;
  incomeTypeId: string;
  amount: number;
  groupId: string;
}

export interface FinanceData {
  wallets: Wallet[];
  incomeTypes: IncomeType[];
  entries: LedgerEntry[];
  allocations: AllocationLog[];
}

export interface Summary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  balances: Record<string, number>;
}

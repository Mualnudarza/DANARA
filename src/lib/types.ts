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
  debts: Debt[];
  debtPayments: DebtPayment[];
  budgets: Budget[];
}

export type DebtDirection = "owe" | "owed";
export type DebtStatus = "active" | "paid";

export interface Debt {
  id: string;
  name: string;
  direction: DebtDirection;
  initialAmount: number;
  note: string;
  status: DebtStatus;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  date: string;
  amount: number;
  walletId: string;
  note: string;
}

export interface Budget {
  id: string;
  walletId: string;
  month: string;
  limitAmount: number;
}

export type BudgetStatus = "safe" | "warning" | "over";

export interface DayAggregate {
  income: number;
  expense: number;
  count: number;
  hasTransfer: boolean;
}

export type View = "dashboard" | "wallets" | "history" | "calendar" | "debts" | "settings";
export type ModalKind = "income" | "expense" | "transfer" | "debt" | "debt-payment" | null;
export type LedgerFilter = "all" | "income" | "expense" | "transfer";

export interface Summary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  balances: Record<string, number>;
}

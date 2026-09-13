export type EntryKind = "income" | "expense" | "transfer-in" | "transfer-out";

export interface Wallet {
  id: string;
  name: string;
  account: string;
  color: string;
}

export interface WalletTarget {
  id: string;
  walletId: string;
  targetAmount: number;
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
  walletId?: string;
  note: string;
}

export type AssetCategory = "saham" | "emas" | "properti" | "ternak" | "barang" | "lainnya";
export type AssetStatus = "active" | "sold";

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  buyPrice: number;
  currentPrice: number;
  sellPrice?: number;
  buyDate: string;
  sellDate?: string;
  status: AssetStatus;
  buyWalletId?: string;
  sellWalletId?: string;
  note: string;
}

export interface FinanceData {
  wallets: Wallet[];
  walletTargets: WalletTarget[];
  incomeTypes: IncomeType[];
  entries: LedgerEntry[];
  allocations: AllocationLog[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  assets: Asset[];
}

export interface DayAggregate {
  income: number;
  expense: number;
  count: number;
  hasTransfer: boolean;
}

export type View = "dashboard" | "wallets" | "history" | "calendar" | "debts" | "assets" | "settings";
export type ModalKind = "income" | "expense" | "transfer" | "debt" | "debt-payment" | null;
export type LedgerFilter = "all" | "income" | "expense" | "transfer";

export interface Summary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  balances: Record<string, number>;
}

# Danara Diagrams Specification

Diagram editorial arsitektur sistem dan skema database fisik untuk aplikasi personal finance **Danara**. Dibuat dengan standar editorial `diagram-design` (self-contained HTML + inline SVG).

---

## 1. System Architecture (`system-architecture.html`)
Mencakup arsitektur 4-tier reaktif:

- **Presentation Tier (Vite + React 19 + Tailwind CSS 4):**
  - `AppLayout` & 7 View Navigasi: Dashboard, Wallets, History, Calendar, Debts, Assets, Settings.
  - Modals: Income Splitter, Expense, Transfer, Debt Repayment, Asset Buy/Sell.
- **Domain Engine Tier (Client-side Logic):**
  - `src/lib/finance.ts`: Perhitungan saldo multikartu (`calculateBalances`), pemecahan alokasi nominal/persen (`splitIncome`), ringkasan KPI bulanan (`dashboardSummary`), agregasi kalender (`aggregateByDay`).
  - `App.tsx` state: Optimistic update & cache entity `FinanceData`.
- **Data Access Layer:**
  - `@supabase/supabase-js`: Batch parallel fetch (`Promise.all` 8 tabel), multi-table atomic upsert (`upsertFinanceData`).
  - Auth listener: `onAuthStateChange` & sinkronisasi token JWT.
- **Cloud Infrastructure (Supabase):**
  - Supabase GoTrue Auth (Session & JWT token).
  - PostgreSQL 15+ Engine (9 tabel relasional).
  - Row Level Security (RLS) terisolasi per tenant (`user_id = auth.uid()`).

File: [`diagrams/system-architecture.html`](./system-architecture.html)

---

## 2. Database Schema (`database-schema.html`)
Mencakup physical schema PostgreSQL dengan tipe SQL riil, constraint chip (`PK`, `FK`, `NN`), dan konektor foreign key column-to-column:

- **Cluster Akun & Transfer:**
  - `public.wallets`: Dompet/kantong penyimpan dana primer.
  - `public.wallet_targets`: Target batas saldo tabungan per wallet (`ON DELETE CASCADE` dari wallet).
  - `public.transfers`: Log audit transfer dana antar-wallet (`from_wallet_id`, `to_wallet_id`).
- **Cluster Ledger & Alokasi:**
  - `public.income_types`: Aturan template alokasi gaji/pemasukan berbasis JSONB.
  - `public.ledger_entries` *(Focal Table)*: Jurnal mutasi kas (`income`, `expense`, `transfer-in`, `transfer-out`). Relasi ke `wallets.id` dan `income_types.id`.
  - `public.allocation_logs`: Jejak audit pembagian uang masuk ke pos dompet per `group_id`.
- **Cluster Kewajiban & Investasi:**
  - `public.debts`: Pencatatan hutang/piutang (`owe`/`owed`) dengan nominal awal dan status.
  - `public.debt_payments`: Cicilan/pembayaran hutang terhubung ke wallet (`ON DELETE CASCADE` dari debt).
  - `public.assets`: Portofolio aset fisik & finansial (saham, emas, properti, ternak, barang) dengan `buy_price`, `current_price`, dan `buy_wallet_id`.

File: [`diagrams/database-schema.html`](./database-schema.html)

---

## Cara Membuka / Export
Buka file HTML langsung di web browser apa pun (Chrome, Edge, Firefox, Safari) atau preview melalui VS Code Live Server. File SVG sepenuhnya self-contained dan scalable tanpa dependensi eksternal selain Google Fonts.

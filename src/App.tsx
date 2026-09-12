import { useEffect, useMemo, useState } from "react";
import { supabase, loadFinanceData } from "./lib/supabase";
import { calculateBalances, dashboardSummary, isValidAllocation, newTransfer, splitIncome } from "./lib/finance";
import type { Debt, FinanceData, IncomeType, LedgerFilter, ModalKind, View, Wallet } from "./lib/types";
import type { User } from "@supabase/supabase-js";
import AppLayout from "./components/layout/AppLayout";
import DashboardView from "./components/views/DashboardView";
import WalletsView from "./components/views/WalletsView";
import HistoryView from "./components/views/HistoryView";
import CalendarView from "./components/views/CalendarView";
import DebtsView from "./components/views/DebtsView";
import BudgetSection from "./components/views/BudgetSection";
import SettingsView from "./components/views/SettingsView";
import { ExpenseModal, IncomeModal, TransferModal } from "./components/forms/TransactionModals";

function inputNumber(value: string) {
  return Number(value.replace(/\D/g, "")) || 0;
}

export default function App() {
  const [data, setData] = useState<FinanceData>({ wallets: [], incomeTypes: [], entries: [], allocations: [], debts: [], debtPayments: [], budgets: [] });
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [modal, setModal] = useState<ModalKind>(null);
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const summary = useMemo(() => dashboardSummary(data.wallets, data.entries), [data]);
  const balances = useMemo(() => calculateBalances(data.wallets, data.entries), [data]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function refresh() {
    try {
      setBusy(true);
      setMessage("");
      setData(await loadFinanceData());
      setMessage("Data terbaru dimuat dari Supabase.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat data.");
    } finally {
      setBusy(false);
    }
  }

  async function save(next: FinanceData) {
    setData(next);
    setModal(null);
    if (!user) return;
    try {
      const { upsertFinanceData: fn } = await import("./lib/supabase");
      await fn(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan.");
    }
  }

  function addIncome(form: FormData) {
    const type = data.incomeTypes.find((item) => item.id === String(form.get("incomeType")));
    const amount = inputNumber(String(form.get("amount")));
    if (!type || !isValidAllocation(type)) {
      setMessage("Tipe pemasukan harus memiliki alokasi tepat 100%.");
      return;
    }
    try {
      const groupId = crypto.randomUUID();
      const date = String(form.get("date"));
      const note = String(form.get("note")) || type.name;
      const entries = splitIncome(amount, type).map(({ walletId, amount: split }) => ({
        id: crypto.randomUUID(),
        date,
        note,
        walletId,
        kind: "income" as const,
        amount: split,
        groupId,
        incomeTypeId: type.id,
      }));
      void save({ ...data, entries: [...data.entries, ...entries], allocations: [...data.allocations, { id: crypto.randomUUID(), date, incomeTypeId: type.id, amount, groupId }] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pemasukan gagal dicatat.");
    }
  }

  function addExpense(form: FormData) {
    const walletId = String(form.get("walletId"));
    const amount = inputNumber(String(form.get("amount")));
    if (amount <= 0 || amount > (balances[walletId] ?? 0)) {
      setMessage("Nominal melebihi saldo dompet.");
      return;
    }
    void save({ ...data, entries: [...data.entries, { id: crypto.randomUUID(), date: String(form.get("date")), note: String(form.get("note")) || "Pengeluaran", walletId, kind: "expense", amount }] });
  }

  function transfer(form: FormData) {
    const from = String(form.get("from"));
    const to = String(form.get("to"));
    const amount = inputNumber(String(form.get("amount")));
    if (from === to) {
      setMessage("Dompet sumber dan tujuan harus berbeda.");
      return;
    }
    if (amount > (balances[from] ?? 0)) {
      setMessage("Nominal melebihi saldo dompet sumber.");
      return;
    }
    try {
      void save({ ...data, entries: [...data.entries, ...newTransfer(from, to, amount, String(form.get("date")), String(form.get("note")) || "Pindah saldo")] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Transfer gagal.");
    }
  }

  function addWallet(form: FormData) {
    const wallet: Wallet = {
      id: crypto.randomUUID(),
      name: String(form.get("name")).trim(),
      account: String(form.get("account")).trim(),
      color: String(form.get("color")) || "#2563eb",
    };
    if (!wallet.name) {
      setMessage("Nama dompet wajib diisi.");
      return;
    }
    void save({ ...data, wallets: [...data.wallets, wallet] });
  }

  function updateWallet(wallet: Wallet) {
    if (!wallet.name.trim()) {
      setMessage("Nama dompet wajib diisi.");
      return;
    }
    void save({ ...data, wallets: data.wallets.map((item) => (item.id === wallet.id ? wallet : item)) });
    setMessage("Dompet diperbarui.");
  }

  async function deleteWallet(id: string) {
    if (data.entries.some((entry) => entry.walletId === id)) {
      setMessage("Dompet tidak bisa dihapus karena memiliki riwayat transaksi.");
      return;
    }
    if (!window.confirm("Hapus dompet ini?")) return;
    const next = { ...data, wallets: data.wallets.filter((item) => item.id !== id) };
    setData(next);
    const { error } = await supabase.from("wallets").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
      void refresh();
    } else {
      setMessage("Dompet dihapus.");
    }
  }

  function addIncomeType(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("Nama tipe wajib diisi.");
      return;
    }
    const type: IncomeType = { id: crypto.randomUUID(), name: trimmed, allocations: Object.fromEntries(data.wallets.map((wallet) => [wallet.id, 0])) };
    void save({ ...data, incomeTypes: [...data.incomeTypes, type] });
    setMessage("Tipe ditambahkan. Atur persentasenya hingga total 100%.");
  }

  function updateIncomeType(type: IncomeType) {
    if (!type.name.trim()) {
      setMessage("Nama tipe wajib diisi.");
      return;
    }
    if (!isValidAllocation(type)) {
      setMessage("Total alokasi harus tepat 100%.");
      return;
    }
    void save({ ...data, incomeTypes: data.incomeTypes.map((item) => (item.id === type.id ? type : item)) });
    setMessage("Alokasi disimpan. Berlaku untuk pemasukan baru.");
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  function setBudget(walletId: string, limit: number) {
    if (limit <= 0 || !Number.isSafeInteger(limit)) {
      setMessage("Pagu harus bilangan bulat lebih dari nol.");
      return;
    }
    const existing = data.budgets.find((item) => item.walletId === walletId && item.month === currentMonth);
    const budgets = existing
      ? data.budgets.map((item) => (item.id === existing.id ? { ...item, limitAmount: limit } : item))
      : [...data.budgets, { id: crypto.randomUUID(), walletId, month: currentMonth, limitAmount: limit }];
    void save({ ...data, budgets });
    setMessage(`Pagu bulan ${currentMonth} disimpan.`);
  }

  function addDebt(form: FormData) {
    const name = String(form.get("name")).trim();
    const direction = String(form.get("direction")) as Debt["direction"];
    const amount = inputNumber(String(form.get("amount")));
    if (!name) {
      setMessage("Nama orang wajib diisi.");
      return;
    }
    if (amount <= 0) {
      setMessage("Nominal hutang harus lebih dari nol.");
      return;
    }
    void save({
      ...data,
      debts: [...data.debts, { id: crypto.randomUUID(), name, direction: direction === "owed" ? "owed" : "owe", initialAmount: amount, note: String(form.get("note")).trim(), status: "active" }],
    });
    setMessage("Hutang dicatat. Saldo dompet tidak berubah.");
  }

  function payDebt(form: FormData) {
    const debt = data.debts.find((item) => item.id === String(form.get("debtId")));
    const walletId = String(form.get("walletId"));
    const amount = inputNumber(String(form.get("amount")));
    const date = String(form.get("date"));
    if (!debt || debt.status !== "active") {
      setMessage("Hutang tidak ditemukan atau sudah lunas.");
      return;
    }
    const remaining = debt.initialAmount - data.debtPayments.filter((payment) => payment.debtId === debt.id).reduce((sum, payment) => sum + payment.amount, 0);
    if (amount <= 0 || amount > remaining) {
      setMessage("Nominal melebihi sisa hutang.");
      return;
    }
    const note = debt.direction === "owe" ? `Bayar hutang ${debt.name}` : `Terima piutang ${debt.name}`;
    if (debt.direction === "owe") {
      if (amount > (balances[walletId] ?? 0)) {
        setMessage("Nominal melebihi saldo dompet sumber.");
        return;
      }
      const paymentId = crypto.randomUUID();
      void save({
        ...data,
        entries: [...data.entries, { id: crypto.randomUUID(), date, note, walletId, kind: "expense", amount }],
        debtPayments: [...data.debtPayments, { id: paymentId, debtId: debt.id, date, amount, walletId, note }],
      });
    } else {
      const paymentId = crypto.randomUUID();
      void save({
        ...data,
        entries: [...data.entries, { id: crypto.randomUUID(), date, note, walletId, kind: "income", amount }],
        debtPayments: [...data.debtPayments, { id: paymentId, debtId: debt.id, date, amount, walletId, note }],
      });
    }
    setMessage("Pembayaran dicatat ke dompet dan sisa hutang.");
  }

  function settleDebt(id: string) {
    const debt = data.debts.find((item) => item.id === id);
    if (!debt) return;
    if (!window.confirm(`Tandai hutang ${debt.name} sebagai lunas?`)) return;
    void save({ ...data, debts: data.debts.map((item) => (item.id === id ? { ...item, status: "paid" as const } : item)) });
    setMessage("Hutang ditandai lunas. Riwayat pembayaran tetap tersimpan.");
  }

  async function deleteDebt(id: string) {
    if (data.debtPayments.some((payment) => payment.debtId === id)) {
      setMessage("Hutang tidak bisa dihapus karena memiliki riwayat pembayaran.");
      return;
    }
    if (!window.confirm("Hapus catatan hutang ini?")) return;
    const next = { ...data, debts: data.debts.filter((item) => item.id !== id) };
    setData(next);
    const { error } = await supabase.from("debts").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
      void refresh();
    } else {
      setMessage("Hutang dihapus.");
    }
  }

  async function deleteIncomeType(id: string) {
    if (data.allocations.some((log) => log.incomeTypeId === id)) {
      setMessage("Tipe tidak bisa dihapus karena sudah dipakai pada riwayat pemasukan.");
      return;
    }
    if (!window.confirm("Hapus tipe alokasi ini?")) return;
    const next = { ...data, incomeTypes: data.incomeTypes.filter((item) => item.id !== id) };
    setData(next);
    const { error } = await supabase.from("income_types").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
      void refresh();
    } else {
      setMessage("Tipe dihapus.");
    }
  }

  if (!user)
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-4">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Manajemen keuangan personal</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">Danara</h1>
          <p className="mt-2 text-sm text-ink-500">Masuk untuk mengelola dompet dan alokasi dana.</p>
          <button className="mt-6 w-full rounded-lg bg-ink-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-ink-700" onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}${import.meta.env.BASE_URL}` } })}>
            Masuk dengan Google
          </button>
        </div>
      </div>
    );

  return (
    <AppLayout
      view={view}
      setView={setView}
      setModal={setModal}
      user={user}
      totalBalance={summary.totalBalance}
      busy={busy}
      message={message}
      clearMessage={() => setMessage("")}
      refresh={() => void refresh()}
      signOut={() => void supabase.auth.signOut()}
    >
      {view === "dashboard" && (
        <div className="grid gap-5">
          <DashboardView data={data} summary={summary} balances={balances} filter={filter} setFilter={setFilter} setModal={setModal} />
          <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
            <h2 className="text-sm font-bold text-ink-900">Budget bulan {currentMonth}</h2>
            <p className="mb-3 mt-0.5 text-xs text-ink-500">Pagu pengeluaran per dompet. Hanya peringatan, tidak memblokir transaksi.</p>
            <BudgetSection data={data} month={currentMonth} setBudget={setBudget} />
          </section>
        </div>
      )}
      {view === "wallets" && <WalletsView data={data} balances={balances} addWallet={addWallet} updateWallet={updateWallet} deleteWallet={(id) => void deleteWallet(id)} />}
      {view === "history" && <HistoryView data={data} filter={filter} setFilter={setFilter} />}
      {view === "calendar" && <CalendarView data={data} />}
      {view === "debts" && <DebtsView data={data} addDebt={addDebt} payDebt={payDebt} settleDebt={settleDebt} deleteDebt={(id) => void deleteDebt(id)} />}
      {view === "settings" && <SettingsView data={data} addIncomeType={addIncomeType} updateIncomeType={updateIncomeType} deleteIncomeType={(id) => void deleteIncomeType(id)} />}
      {modal === "income" && <IncomeModal data={data} onClose={() => setModal(null)} onSubmit={addIncome} />}
      {modal === "expense" && <ExpenseModal data={data} balances={balances} onClose={() => setModal(null)} onSubmit={addExpense} />}
      {modal === "transfer" && <TransferModal data={data} balances={balances} onClose={() => setModal(null)} onSubmit={transfer} />}
    </AppLayout>
  );
}

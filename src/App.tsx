import { useEffect, useMemo, useState } from "react";
import { supabase, loadFinanceData, upsertFinanceData, clearRemoteFinanceData } from "./lib/supabase";
import { calculateBalances, dashboardSummary, isValidAllocation, newTransfer, splitIncome } from "./lib/finance";
import { initialFinanceData } from "./lib/storage";
import type { Asset, Debt, FinanceData, IncomeType, LedgerFilter, ModalKind, View, Wallet } from "./lib/types";
import type { UserLike } from "./components/layout/types";
import type { User } from "@supabase/supabase-js";
import AppLayout from "./components/layout/AppLayout";
import DashboardView from "./components/views/DashboardView";
import WalletsView from "./components/views/WalletsView";
import AssetsView from "./components/views/AssetsView";
import HistoryView from "./components/views/HistoryView";
import CalendarView from "./components/views/CalendarView";
import DebtsView from "./components/views/DebtsView";
import SettingsView from "./components/views/SettingsView";
import MenuView from "./components/views/MenuView";
import { ExpenseModal, IncomeModal, TransferModal } from "./components/forms/TransactionModals";

function inputNumber(value: string) {
  return Number(value.replace(/\D/g, "")) || 0;
}

export default function App() {
  const [data, setData] = useState<FinanceData>(initialFinanceData);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [view, setView] = useState<View>("dashboard");
  const [modal, setModal] = useState<ModalKind>(null);
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const activeUser: UserLike = { email: user?.email, user_metadata: user?.user_metadata };

  const summary = useMemo(() => dashboardSummary(data.wallets, data.entries), [data]);
  const balances = useMemo(() => calculateBalances(data.wallets, data.entries), [data]);

  useEffect(() => {
    const handleOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOnline);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setDataReady(false);
      if (!session?.user) setData(initialFinanceData);
    });
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(error.message);
      setUser(data.user);
      setAuthReady(true);
    }).catch((error: unknown) => {
      if (active) {
        setMessage(error instanceof Error ? error.message : "Gagal memeriksa sesi.");
        setAuthReady(true);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !online) {
      setDataReady(false);
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, online]);

  async function refresh() {
    if (!user || !online) {
      setDataReady(false);
      setMessage(user ? "Koneksi internet diperlukan." : "Masuk dengan Google untuk melanjutkan.");
      return;
    }
    try {
      setBusy(true);
      setDataReady(false);
      setMessage("");
      const remoteData = await loadFinanceData();
      setData(remoteData);
      setDataReady(true);
      setMessage("Data terbaru dimuat dari Supabase.");
    } catch (error) {
      setDataReady(false);
      setMessage(error instanceof Error ? error.message : "Gagal memuat data cloud.");
    } finally {
      setBusy(false);
    }
  }

  async function save(next: FinanceData) {
    setModal(null);
    if (!user || !online) {
      setDataReady(false);
      setMessage("Koneksi internet diperlukan. Data tidak disimpan.");
      return;
    }
    try {
      await upsertFinanceData(next);
      setData(next);
      setMessage("Perubahan tersimpan ke Supabase.");
    } catch (error) {
      setDataReady(false);
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan data cloud.");
    }
  }

  function signInWithGoogle() {
    void supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}${import.meta.env.BASE_URL}` },
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setData(initialFinanceData);
    setDataReady(false);
    setMessage("Masuk dengan Google untuk melanjutkan.");
  }

  async function resetAllData() {
    try {
      await clearRemoteFinanceData();
      await upsertFinanceData(initialFinanceData);
      setData(initialFinanceData);
      setMessage("Seluruh data berhasil direset ke pengaturan awal.");
      setView("dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mereset data cloud.");
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
    try {
      await supabase.from("wallets").delete().eq("id", id).throwOnError();
      setMessage("Dompet dihapus.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus dompet cloud.");
    }
  }

  async function setWalletTarget(walletId: string, targetAmount: number) {
    if (targetAmount <= 0) {
      const nextTargets = data.walletTargets.filter((t) => t.walletId !== walletId);
      const next = { ...data, walletTargets: nextTargets };
      try {
        await supabase.from("wallet_targets").delete().eq("wallet_id", walletId).throwOnError();
        setData(next);
        setMessage("Target dompet dihapus.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal menghapus target cloud.");
      }
      return;
    }

    const existing = data.walletTargets.find((t) => t.walletId === walletId);
    const updatedTarget = existing
      ? { ...existing, targetAmount }
      : { id: crypto.randomUUID(), walletId, targetAmount };

    const nextTargets = existing
      ? data.walletTargets.map((t) => (t.id === existing.id ? updatedTarget : t))
      : [...data.walletTargets, updatedTarget];

    void save({ ...data, walletTargets: nextTargets });
    setMessage("Target dompet diperbarui.");
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

  async function deleteIncomeType(id: string) {
    if (data.allocations.some((log) => log.incomeTypeId === id)) {
      setMessage("Tipe tidak bisa dihapus karena sudah dipakai pada riwayat pemasukan.");
      return;
    }
    if (!window.confirm("Hapus tipe alokasi ini?")) return;
    try {
      await supabase.from("income_types").delete().eq("id", id).throwOnError();
      setMessage("Tipe dihapus.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus tipe cloud.");
    }
  }

  // --- DEBTS with source wallet & top-up ---
  function addDebt(form: FormData) {
    const name = String(form.get("name")).trim();
    const direction = String(form.get("direction")) as Debt["direction"];
    const amount = inputNumber(String(form.get("amount")));
    const sourceWalletId = String(form.get("sourceWalletId") || "outside");
    const date = String(form.get("date"));
    const note = String(form.get("note")).trim();

    if (!name) {
      setMessage("Nama orang wajib diisi.");
      return;
    }
    if (amount <= 0) {
      setMessage("Nominal hutang harus lebih dari nol.");
      return;
    }

    let nextEntries = data.entries;

    // If lending money and sourced from wallet, record expense
    if (direction === "owed" && sourceWalletId !== "outside") {
      if (amount > (balances[sourceWalletId] ?? 0)) {
        setMessage("Nominal melebihi saldo dompet sumber.");
        return;
      }
      const entryId = crypto.randomUUID();
      nextEntries = [
        ...nextEntries,
        {
          id: entryId,
          date,
          note: `Pinjaman ke ${name}${note ? ` · ${note}` : ""}`,
          walletId: sourceWalletId,
          kind: "expense",
          amount,
        },
      ];
    }

    const newDebt: Debt = {
      id: crypto.randomUUID(),
      name,
      direction: direction === "owed" ? "owed" : "owe",
      initialAmount: amount,
      note,
      status: "active",
    };

    void save({
      ...data,
      debts: [...data.debts, newDebt],
      entries: nextEntries,
    });
    setMessage(
      direction === "owed" && sourceWalletId !== "outside"
        ? "Piutang dicatat dan saldo dompet dipotong."
        : "Hutang dicatat. Saldo dompet tidak berubah."
    );
  }

  function topUpDebt(form: FormData) {
    const debt = data.debts.find((item) => item.id === String(form.get("debtId")));
    const amount = inputNumber(String(form.get("amount")));
    const walletId = String(form.get("walletId") || "outside");
    const date = String(form.get("date"));
    const extraNote = String(form.get("note")).trim();

    if (!debt || debt.status !== "active") {
      setMessage("Hutang tidak ditemukan atau sudah lunas.");
      return;
    }
    if (amount <= 0) {
      setMessage("Nominal tambahan harus lebih dari nol.");
      return;
    }

    let nextEntries = data.entries;
    if (debt.direction === "owed" && walletId !== "outside") {
      if (amount > (balances[walletId] ?? 0)) {
        setMessage("Nominal melebihi saldo dompet sumber.");
        return;
      }
      nextEntries = [
        ...nextEntries,
        {
          id: crypto.randomUUID(),
          date,
          note: `Tambah pinjaman ke ${debt.name}${extraNote ? ` · ${extraNote}` : ""}`,
          walletId,
          kind: "expense",
          amount,
        },
      ];
    }

    const updatedDebt: Debt = {
      ...debt,
      initialAmount: debt.initialAmount + amount,
      note: extraNote ? (debt.note ? `${debt.note}; ${extraNote}` : extraNote) : debt.note,
    };

    void save({
      ...data,
      debts: data.debts.map((d) => (d.id === debt.id ? updatedDebt : d)),
      entries: nextEntries,
    });
    setMessage(`Nominal hutang ${debt.name} ditambah ${amount}.`);
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
    const remaining =
      debt.initialAmount -
      data.debtPayments.filter((payment) => payment.debtId === debt.id).reduce((sum, payment) => sum + payment.amount, 0);

    if (amount <= 0 || amount > remaining) {
      setMessage("Nominal melebihi sisa hutang.");
      return;
    }

    const note = debt.direction === "owe" ? `Bayar hutang ${debt.name}` : `Terima piutang ${debt.name}`;
    let nextEntries = data.entries;

    if (walletId !== "outside") {
      if (debt.direction === "owe") {
        if (amount > (balances[walletId] ?? 0)) {
          setMessage("Nominal melebihi saldo dompet sumber.");
          return;
        }
        nextEntries = [
          ...nextEntries,
          { id: crypto.randomUUID(), date, note, walletId, kind: "expense", amount },
        ];
      } else {
        nextEntries = [
          ...nextEntries,
          { id: crypto.randomUUID(), date, note, walletId, kind: "income", amount },
        ];
      }
    }

    const paymentId = crypto.randomUUID();
    const newPayment = {
      id: paymentId,
      debtId: debt.id,
      date,
      amount,
      walletId: walletId !== "outside" ? walletId : undefined,
      note,
    };

    void save({
      ...data,
      entries: nextEntries,
      debtPayments: [...data.debtPayments, newPayment],
    });
    setMessage("Pembayaran dicatat.");
  }

  function settleDebt(id: string) {
    const debt = data.debts.find((item) => item.id === id);
    if (!debt) return;
    if (!window.confirm(`Tandai hutang ${debt.name} sebagai lunas?`)) return;
    void save({ ...data, debts: data.debts.map((item) => (item.id === id ? { ...item, status: "paid" as const } : item)) });
    setMessage("Hutang ditandai lunas.");
  }

  async function deleteDebt(id: string) {
    if (data.debtPayments.some((payment) => payment.debtId === id)) {
      setMessage("Hutang tidak bisa dihapus karena memiliki riwayat pembayaran.");
      return;
    }
    if (!window.confirm("Hapus catatan hutang ini?")) return;
    try {
      await supabase.from("debts").delete().eq("id", id).throwOnError();
      setMessage("Hutang dihapus.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus hutang cloud.");
    }
  }

  // --- ASSETS ---
  function addAsset(form: FormData) {
    const name = String(form.get("name")).trim();
    const category = String(form.get("category")) as Asset["category"];
    const buyPrice = inputNumber(String(form.get("buyPrice")));
    const buyWalletId = String(form.get("buyWalletId") || "outside");
    const buyDate = String(form.get("buyDate"));
    const note = String(form.get("note")).trim();

    if (!name) {
      setMessage("Nama aset wajib diisi.");
      return;
    }
    if (buyPrice <= 0) {
      setMessage("Harga beli harus lebih dari nol.");
      return;
    }

    let nextEntries = data.entries;
    if (buyWalletId !== "outside") {
      if (buyPrice > (balances[buyWalletId] ?? 0)) {
        setMessage("Harga beli melebihi saldo dompet sumber.");
        return;
      }
      nextEntries = [
        ...nextEntries,
        {
          id: crypto.randomUUID(),
          date: buyDate,
          note: `Beli aset: ${name}`,
          walletId: buyWalletId,
          kind: "expense",
          amount: buyPrice,
        },
      ];
    }

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name,
      category,
      buyPrice,
      currentPrice: buyPrice,
      buyDate,
      status: "active",
      buyWalletId: buyWalletId !== "outside" ? buyWalletId : undefined,
      note,
    };

    void save({
      ...data,
      assets: [newAsset, ...data.assets],
      entries: nextEntries,
    });
    setMessage("Aset baru dicatat.");
  }

  function updateAssetPrice(id: string, newPrice: number) {
    if (newPrice < 0) {
      setMessage("Nilai aset tidak boleh negatif.");
      return;
    }
    void save({
      ...data,
      assets: data.assets.map((a) => (a.id === id ? { ...a, currentPrice: newPrice } : a)),
    });
    setMessage("Nilai kini aset diperbarui.");
  }

  function sellAsset(form: FormData) {
    const assetId = String(form.get("assetId"));
    const sellPrice = inputNumber(String(form.get("sellPrice")));
    const sellWalletId = String(form.get("sellWalletId") || "outside");
    const sellDate = String(form.get("sellDate"));

    const asset = data.assets.find((a) => a.id === assetId);
    if (!asset || asset.status === "sold") {
      setMessage("Aset tidak ditemukan atau sudah terjual.");
      return;
    }
    if (sellPrice < 0) {
      setMessage("Harga jual tidak boleh negatif.");
      return;
    }

    let nextEntries = data.entries;
    if (sellWalletId !== "outside" && sellPrice > 0) {
      nextEntries = [
        ...nextEntries,
        {
          id: crypto.randomUUID(),
          date: sellDate,
          note: `Jual aset: ${asset.name}`,
          walletId: sellWalletId,
          kind: "income",
          amount: sellPrice,
        },
      ];
    }

    const updatedAsset: Asset = {
      ...asset,
      status: "sold",
      sellPrice,
      sellDate,
      sellWalletId: sellWalletId !== "outside" ? sellWalletId : undefined,
    };

    void save({
      ...data,
      assets: data.assets.map((a) => (a.id === asset.id ? updatedAsset : a)),
      entries: nextEntries,
    });
    setMessage("Penjualan aset dicatat.");
  }

  async function deleteAsset(id: string) {
    if (!window.confirm("Hapus catatan aset ini?")) return;
    try {
      await supabase.from("assets").delete().eq("id", id).throwOnError();
      setMessage("Aset dihapus.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus aset cloud.");
    }
  }

  if (!authReady || (user && busy)) {
    return <main className="grid min-h-screen place-items-center bg-canvas p-6 text-sm text-ink-600">Memeriksa sesi dan memuat data cloud…</main>;
  }

  if (!user || !dataReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas p-6">
        <section className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-ink-900">Danara</h1>
          <p className="mt-2 text-sm text-ink-600">{!online ? "Koneksi internet diperlukan untuk mengakses data." : message || "Masuk dengan Google untuk melanjutkan."}</p>
          {user ? (
            <button onClick={() => void refresh()} className="mt-4 w-full rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white">Coba lagi</button>
          ) : (
            <button onClick={signInWithGoogle} className="mt-4 w-full rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white">Masuk dengan Google</button>
          )}
        </section>
      </main>
    );
  }

  return (
    <AppLayout
      view={view}
      setView={setView}
      setModal={setModal}
      user={activeUser}
      totalBalance={summary.totalBalance}
      busy={busy}
      message={message}
      clearMessage={() => setMessage("")}
      refresh={() => void refresh()}
      signOut={() => void handleSignOut()}
    >
      {view === "dashboard" && (
        <DashboardView data={data} summary={summary} balances={balances} filter={filter} setFilter={setFilter} setModal={setModal} />
      )}
      {view === "wallets" && (
        <WalletsView
          data={data}
          balances={balances}
          addWallet={addWallet}
          updateWallet={updateWallet}
          deleteWallet={(id) => void deleteWallet(id)}
          setWalletTarget={(wId, t) => void setWalletTarget(wId, t)}
        />
      )}
      {view === "assets" && (
        <AssetsView
          data={data}
          balances={balances}
          addAsset={addAsset}
          updateAssetPrice={updateAssetPrice}
          sellAsset={sellAsset}
          deleteAsset={(id) => void deleteAsset(id)}
        />
      )}
      {view === "debts" && (
        <DebtsView
          data={data}
          balances={balances}
          addDebt={addDebt}
          topUpDebt={topUpDebt}
          payDebt={payDebt}
          settleDebt={settleDebt}
          deleteDebt={(id) => void deleteDebt(id)}
        />
      )}
      {view === "history" && <HistoryView data={data} filter={filter} setFilter={setFilter} />}
      {view === "calendar" && <CalendarView data={data} />}
      {view === "settings" && (
        <SettingsView
          data={data}
          user={activeUser}
          addIncomeType={addIncomeType}
          updateIncomeType={updateIncomeType}
          deleteIncomeType={(id) => void deleteIncomeType(id)}
              signOut={() => void handleSignOut()}
          onResetAllData={() => void resetAllData()}
        />
      )}
      {view === "menu" && (
        <MenuView
          setView={setView}
          user={activeUser}
          totalBalance={summary.totalBalance}
          assetsCount={data.assets.filter((a) => a.status === "active").length}
          activeDebtsCount={data.debts.filter((d) => d.status === "active").length}
        />
      )}
      {modal === "income" && <IncomeModal data={data} onClose={() => setModal(null)} onSubmit={addIncome} />}
      {modal === "expense" && <ExpenseModal data={data} balances={balances} onClose={() => setModal(null)} onSubmit={addExpense} />}
      {modal === "transfer" && <TransferModal data={data} balances={balances} onClose={() => setModal(null)} onSubmit={transfer} />}
    </AppLayout>
  );
}

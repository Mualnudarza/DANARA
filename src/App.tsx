import { useEffect, useMemo, useState } from "react";
import { BarChart3, LogOut, Plus, RefreshCw, Settings2, WalletCards } from "lucide-react";
import { supabase, loadFinanceData, upsertFinanceData } from "./lib/supabase";
import { calculateBalances, dashboardSummary, isValidAllocation, newTransfer, rupiah, splitIncome } from "./lib/finance";
import type { FinanceData, IncomeType, Wallet } from "./lib/types";

const today = new Date().toISOString().slice(0, 10);

export default function App() {
  const [data, setData] = useState<FinanceData>({ wallets: [], incomeTypes: [], entries: [], allocations: [] });
  const [user, setUser] = useState<((typeof supabase.auth)["user"]) | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const summary = useMemo(() => dashboardSummary(data.wallets, data.entries), [data]);
  const balances = useMemo(() => calculateBalances(data.wallets, data.entries), [data]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
  }, []);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try { setBusy(true); setData(await loadFinanceData()); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Gagal memuat data."); }
      finally { setBusy(false); }
    })();
  }, [user]);

  async function refresh() {
    try { setBusy(true); setMessage(""); setData(await loadFinanceData()); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Gagal memuat data."); }
    finally { setBusy(false); }
  }
  async function save(next: FinanceData) { setData(next); if (user) await upsertFinanceData(next).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Gagal menyimpan.")); }
  function addIncome(form: FormData) {
    const type = data.incomeTypes.find((item) => item.id === form.get("incomeType"));
    const amount = Number(String(form.get("amount")).replace(/\D/g, "")) || 0;
    if (!type || !isValidAllocation(type)) { setMessage("Tipe pemasukan harus memiliki alokasi tepat 100%."); return; }
    try {
      const groupId = crypto.randomUUID();
      const date = String(form.get("date"));
      const note = String(form.get("note")) || type.name;
      const entries = splitIncome(amount, type).map(({ walletId, amount: split }) => ({ id: crypto.randomUUID(), date, note, walletId, kind: "income" as const, amount: split, groupId, incomeTypeId: type.id }));
      void save({ ...data, entries: [...data.entries, ...entries], allocations: [...data.allocations, { id: crypto.randomUUID(), date, incomeTypeId: type.id, amount, groupId }] });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Pemasukan gagal dicatat."); }
  }
  function addExpense(form: FormData) {
    const walletId = String(form.get("walletId"));
    const amount = Number(String(form.get("amount")).replace(/\D/g, "")) || 0;
    if (amount <= 0 || amount > (balances[walletId] ?? 0)) { setMessage("Nominal melebihi saldo dompet."); return; }
    void save({ ...data, entries: [...data.entries, { id: crypto.randomUUID(), date: String(form.get("date")), note: String(form.get("note")) || "Pengeluaran", walletId, kind: "expense", amount }] });
  }
  function transfer(form: FormData) {
    const from = String(form.get("from")); const to = String(form.get("to")); const amount = Number(String(form.get("amount")).replace(/\D/g, "")) || 0;
    if (amount > (balances[from] ?? 0)) { setMessage("Nominal melebihi saldo dompet sumber."); return; }
    try { void save({ ...data, entries: [...data.entries, ...newTransfer(from, to, amount, String(form.get("date")), String(form.get("note")) || "Pindah saldo")] }); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Transfer gagal."); }
  }
  function addWallet(form: FormData) { const wallet: Wallet = { id: crypto.randomUUID(), name: String(form.get("name")), account: String(form.get("account")), color: String(form.get("color")) || "#2563eb" }; if (!wallet.name.trim()) { setMessage("Nama dompet wajib diisi."); return; } void save({ ...data, wallets: [...data.wallets, wallet] }); }

  if (!user) return <div className="auth-shell"><div className="auth-card"><p className="eyebrow">Manajemen keuangan personal</p><h1>Danara</h1><p>Masuk untuk memulai.</p><button className="button primary" onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/` } })}>Masuk dengan Google</button></div></div>;

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">D</span><span>Danara</span></div><nav>{[{ key: "dashboard", label: "Dashboard", icon: BarChart3 }, { key: "wallets", label: "Dompet", icon: WalletCards }, { key: "settings", label: "Pengaturan", icon: Settings2 }].map(({ key, label, icon: Icon }) => <button key={key} className="nav-item"><Icon size={18}/>{label}</button>)}</nav><button className="nav-item logout" onClick={() => void supabase.auth.signOut()}><LogOut size={18}/>Keluar</button><div className="sidebar-bottom"><p className="eyebrow">Total saldo</p><strong>{rupiah.format(summary.totalBalance)}</strong></div></aside>
    <main><header className="topbar"><div><p className="eyebrow">Keuangan personal</p><h1>Dashboard</h1></div><button className="button secondary" onClick={() => refresh()} disabled={busy}><RefreshCw size={16}/>{busy ? "Sinkronisasi…" : "Refresh"}</button></header>
      {message && <div className="notice" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}
      <section className="page-content"><Stats summary={summary}/>{data.wallets.length === 0 ? <Empty label="Tambahkan dompet di Pengaturan untuk memulai."/> : <WalletBar data={data} balances={balances}/>}</section>
    </main>
  </div>;
}

function Stats({ summary }: { summary: { totalBalance: number; monthIncome: number; monthExpense: number } }) { return <div className="stats"><CardStat label="Total saldo" value={rupiah.format(summary.totalBalance)}/><CardStat label="Pemasukan bulan ini" value={rupiah.format(summary.monthIncome)}/><CardStat label="Pengeluaran bulan ini" value={rupiah.format(summary.monthExpense)}/><CardStat label="Net bulan ini" value={rupiah.format(summary.monthIncome - summary.monthExpense)}/>;</div>; }
function CardStat({ label, value }: { label: string; value: string }) { return <section className="stat-card"><div className="stat-icon"><BarChart3/></div><p>{label}</p><strong>{value}</strong></section>; }
function WalletBar({ data, balances }: { data: FinanceData; balances: Record<string, number> }) { const max = Math.max(...Object.values(balances), 1); return <section className="card"><div className="card-header"><h2>Saldo per dompet</h2></div><div className="wallet-bars">{data.wallets.map((wallet) => <div className="wallet-bar" key={wallet.id}><div className="bar-label"><span><i style={{ background: wallet.color }}/>{wallet.name}<small>{wallet.account}</small></span><strong>{rupiah.format(balances[wallet.id] ?? 0)}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(0, ((balances[wallet.id] ?? 0) / max) * 100)}%`, background: wallet.color }}/></div>)}</div></section>; }
function Empty({ label }: { label: string }) { return <div className="empty">{label}</div>; }

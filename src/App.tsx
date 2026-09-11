import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BarChart3, Cloud, Landmark, Plus, RefreshCw, Settings2, WalletCards } from "lucide-react";
import { allocationTotal, calculateBalances, dashboardSummary, isValidAllocation, newTransfer, rupiah, splitIncome } from "./lib/finance";
import { createSpreadsheet, ensureTemplate, getAccessToken, readFinanceData, saveFinanceData } from "./lib/google-sheets";
import type { FinanceData, IncomeType, LedgerEntry, Wallet } from "./lib/types";

const today = new Date().toISOString().slice(0, 10);
const starterWallets: Wallet[] = [
  ["tabungan", "Tabungan", "BCA", "#2563eb"], ["belanja", "Belanja Harian", "GoPay", "#16a34a"], ["tagihan", "Tagihan & Cicilan", "Mandiri", "#f59e0b"], ["hiburan", "Hiburan", "DANA", "#a855f7"], ["investasi", "Investasi", "Bibit", "#ec4899"], ["sosial", "Sosial", "Cash", "#0f766e"],
].map(([id, name, account, color]) => ({ id, name, account, color }));
const starterTypes: IncomeType[] = [
  { id: "gaji", name: "Gaji Bulanan", allocations: { tabungan: 30, belanja: 25, tagihan: 20, hiburan: 10, investasi: 10, sosial: 5 } },
  { id: "freelance", name: "Freelance", allocations: { tabungan: 40, belanja: 15, tagihan: 10, hiburan: 15, investasi: 15, sosial: 5 } },
  { id: "bonus", name: "Bonus / THR", allocations: { tabungan: 50, belanja: 10, tagihan: 10, hiburan: 10, investasi: 15, sosial: 5 } },
];
const initialData: FinanceData = { wallets: starterWallets, incomeTypes: starterTypes, entries: [], allocations: [] };
type View = "dashboard" | "wallets" | "settings";
type Modal = "income" | "expense" | "transfer" | "wallet" | null;

function inputNumber(value: string) { return Number(value.replace(/\D/g, "")) || 0; }

export default function App() {
  const [data, setData] = useState<FinanceData>(initialData);
  const [view, setView] = useState<View>("dashboard");
  const [modal, setModal] = useState<Modal>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState(() => localStorage.getItem("danara-sheet-id") ?? "");
  const [clientId, setClientId] = useState(() => localStorage.getItem("danara-client-id") ?? "");
  const summary = useMemo(() => dashboardSummary(data.wallets, data.entries), [data]);
  const balances = useMemo(() => calculateBalances(data.wallets, data.entries), [data]);

  async function connect() {
    if (!clientId) { setMessage("Masukkan Google OAuth Client ID terlebih dahulu."); return; }
    try {
      setBusy(true);
      const token = await getAccessToken(clientId);
      setAccessToken(token);
      if (spreadsheetId) await sync("read", data, token);
      else setMessage("Google terhubung. Pilih atau buat spreadsheet.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Koneksi Google gagal."); }
    finally { setBusy(false); }
  }
  async function createSheet() {
    if (!accessToken) { setMessage("Hubungkan Google terlebih dahulu."); return; }
    try { setBusy(true); const id = await createSpreadsheet(accessToken); await ensureTemplate(id, accessToken); setSpreadsheetId(id); localStorage.setItem("danara-sheet-id", id); setMessage("Spreadsheet Danara dibuat."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Spreadsheet gagal dibuat."); }
    finally { setBusy(false); }
  }
  async function sync(direction: "read" | "write", source = data, token = accessToken) {
    if (!token || !spreadsheetId) { setMessage("Hubungkan Google dan isi Spreadsheet ID."); return; }
    try {
      setBusy(true); await ensureTemplate(spreadsheetId, token);
      if (direction === "read") { setData(await readFinanceData(spreadsheetId, token)); setMessage("Data dimuat dari Google Sheets."); }
      else { await saveFinanceData(spreadsheetId, token, source); setMessage("Data disimpan ke Google Sheets."); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sinkronisasi gagal."); }
    finally { setBusy(false); }
  }
  function update(next: FinanceData) { setData(next); if (accessToken && spreadsheetId) void sync("write", next); }
  function addIncome(form: FormData) {
    const type = data.incomeTypes.find((item) => item.id === form.get("incomeType")); const amount = inputNumber(String(form.get("amount")));
    if (!type || !isValidAllocation(type)) { setMessage("Tipe pemasukan harus memiliki alokasi tepat 100%."); return; }
    try {
      const groupId = crypto.randomUUID(); const date = String(form.get("date")); const note = String(form.get("note")) || type.name;
      const entries = splitIncome(amount, type).map(({ walletId, amount: split }) => ({ id: crypto.randomUUID(), date, note, walletId, kind: "income" as const, amount: split, groupId, incomeTypeId: type.id }));
      update({ ...data, entries: [...data.entries, ...entries], allocations: [...data.allocations, { id: crypto.randomUUID(), date, incomeTypeId: type.id, amount, groupId }] }); setModal(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Pemasukan gagal dicatat."); }
  }
  function addExpense(form: FormData) {
    const walletId = String(form.get("walletId")); const amount = inputNumber(String(form.get("amount")));
    if (amount <= 0 || amount > (balances[walletId] ?? 0)) { setMessage("Nominal melebihi saldo dompet."); return; }
    update({ ...data, entries: [...data.entries, { id: crypto.randomUUID(), date: String(form.get("date")), note: String(form.get("note")) || "Pengeluaran", walletId, kind: "expense", amount }] }); setModal(null);
  }
  function transfer(form: FormData) {
    const from = String(form.get("from")); const to = String(form.get("to")); const amount = inputNumber(String(form.get("amount")));
    if (amount > (balances[from] ?? 0)) { setMessage("Nominal melebihi saldo dompet sumber."); return; }
    try { update({ ...data, entries: [...data.entries, ...newTransfer(from, to, amount, String(form.get("date")), String(form.get("note")) || "Pindah saldo")] }); setModal(null); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Transfer gagal."); }
  }
  function addWallet(form: FormData) {
    const wallet: Wallet = { id: crypto.randomUUID(), name: String(form.get("name")), account: String(form.get("account")), color: String(form.get("color")) || "#2563eb" };
    if (!wallet.name.trim()) { setMessage("Nama dompet wajib diisi."); return; }
    update({ ...data, wallets: [...data.wallets, wallet] }); setModal(null);
  }
  function saveIncomeType(id: string, name: string, allocations: Record<string, number>) {
    const type = { id, name, allocations };
    if (!isValidAllocation(type)) { setMessage("Total alokasi harus tepat 100%."); return; }
    update({ ...data, incomeTypes: data.incomeTypes.map((item) => item.id === id ? type : item) }); setMessage("Pengaturan alokasi disimpan.");
  }
  const nav = [{ key: "dashboard" as const, label: "Dashboard", icon: BarChart3 }, { key: "wallets" as const, label: "Dompet", icon: WalletCards }, { key: "settings" as const, label: "Pengaturan", icon: Settings2 }];

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">D</span><span>Danara</span></div><nav>{nav.map(({ key, label, icon: Icon }) => <button className={view === key ? "nav-item active" : "nav-item"} key={key} onClick={() => setView(key)}><Icon size={18}/>{label}</button>)}</nav><div className="sidebar-bottom"><p className="eyebrow">Total saldo</p><strong>{rupiah.format(summary.totalBalance)}</strong></div></aside>
    <main><header className="topbar"><div><p className="eyebrow">Keuangan personal</p><h1>{view === "dashboard" ? "Ringkasan keuangan" : view === "wallets" ? "Dompet" : "Pengaturan alokasi"}</h1></div><div className="top-actions"><button className="button ghost" onClick={() => void sync("read")} disabled={busy || !accessToken}><RefreshCw size={16}/> Sinkronkan</button><button className="button outline" onClick={() => setModal("transfer")}><ArrowLeftRight size={16}/> Pindah saldo</button><button className="button" onClick={() => setModal("income")}><Plus size={16}/> Dana masuk</button></div></header>
      {message && <div className="notice" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}
      {view === "dashboard" && <Dashboard data={data} summary={summary} balances={balances} setModal={setModal}/>}
      {view === "wallets" && <WalletList data={data} balances={balances} onAdd={() => setModal("wallet")}/>}
      {view === "settings" && <Settings data={data} clientId={clientId} spreadsheetId={spreadsheetId} connected={Boolean(accessToken)} busy={busy} setClientId={(value) => { setClientId(value); localStorage.setItem("danara-client-id", value); }} setSpreadsheetId={(value) => { setSpreadsheetId(value); localStorage.setItem("danara-sheet-id", value); }} connect={connect} createSheet={createSheet} sync={sync} onSaveType={saveIncomeType}/>}
    </main>
    {modal === "income" && <IncomeModal data={data} onClose={() => setModal(null)} onSubmit={addIncome}/>} {modal === "expense" && <ExpenseModal data={data} balances={balances} onClose={() => setModal(null)} onSubmit={addExpense}/>} {modal === "transfer" && <TransferModal data={data} balances={balances} onClose={() => setModal(null)} onSubmit={transfer}/>} {modal === "wallet" && <WalletModal onClose={() => setModal(null)} onSubmit={addWallet}/>}
  </div>;
}

function Dashboard({ data, summary, balances, setModal }: { data: FinanceData; summary: ReturnType<typeof dashboardSummary>; balances: Record<string, number>; setModal: (value: Modal) => void }) {
  const recent = [...data.entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8); const max = Math.max(...Object.values(balances), 1);
  return <section className="page-content"><div className="stats"><Stat label="Total saldo" value={rupiah.format(summary.totalBalance)} icon={<Landmark/>}/><Stat label="Pemasukan bulan ini" value={rupiah.format(summary.monthIncome)} icon={<ArrowDownLeft/>} tone="success"/><Stat label="Pengeluaran bulan ini" value={rupiah.format(summary.monthExpense)} icon={<ArrowUpRight/>} tone="danger"/><Stat label="Net bulan ini" value={rupiah.format(summary.monthIncome - summary.monthExpense)} icon={<BarChart3/>}/></div><div className="grid-two"><section className="card"><div className="card-header"><div><h2>Saldo per dompet</h2><p>Akumulasi seluruh transaksi</p></div><button className="button ghost small" onClick={() => setModal("wallet")}>Kelola</button></div><div className="wallet-bars">{data.wallets.map((wallet) => <div className="wallet-bar" key={wallet.id}><div className="bar-label"><span><i style={{ background: wallet.color }}/>{wallet.name}<small>{wallet.account}</small></span><strong>{rupiah.format(balances[wallet.id] ?? 0)}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(0, ((balances[wallet.id] ?? 0) / max) * 100)}%`, background: wallet.color }}/></div></div>)}</div></section><section className="card quick-card"><div className="card-header"><div><h2>Catat transaksi</h2><p>Saldo dompet berubah saat disimpan</p></div></div><button className="quick-action" onClick={() => setModal("income")}><span className="icon success"><ArrowDownLeft/></span><span><strong>Dana masuk</strong><small>Bagi otomatis menurut alokasi</small></span><Plus size={18}/></button><button className="quick-action" onClick={() => setModal("expense")}><span className="icon danger"><ArrowUpRight/></span><span><strong>Pengeluaran</strong><small>Kurangi satu dompet</small></span><Plus size={18}/></button><button className="quick-action" onClick={() => setModal("transfer")}><span className="icon neutral"><ArrowLeftRight/></span><span><strong>Pindah saldo</strong><small>Antar-dompet, saldo total tetap</small></span><Plus size={18}/></button></section></div><section className="card"><div className="card-header"><div><h2>Transaksi terakhir</h2><p>{recent.length ? "Riwayat perubahan saldo" : "Belum ada transaksi"}</p></div></div>{recent.length ? <div className="transaction-list">{recent.map((entry) => { const wallet = data.wallets.find((item) => item.id === entry.walletId); const outgoing = entry.kind === "expense" || entry.kind === "transfer-out"; return <div className="transaction" key={entry.id}><span className={outgoing ? "transaction-icon out" : "transaction-icon in"}>{outgoing ? <ArrowUpRight size={16}/> : <ArrowDownLeft size={16}/>}</span><span className="transaction-info"><strong>{entry.note}</strong><small>{entry.date} · {wallet?.name ?? "Dompet dihapus"}</small></span><strong className={outgoing ? "amount out" : "amount in"}>{outgoing ? "−" : "+"}{rupiah.format(entry.amount)}</strong></div>; })}</div> : <Empty label="Catat dana masuk pertama untuk melihat dashboard."/>}</section></section>;
}
function Stat({ label, value, icon, tone = "" }: { label: string; value: string; icon: React.ReactNode; tone?: string }) { return <section className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><p>{label}</p><strong>{value}</strong></section>; }
function WalletList({ data, balances, onAdd }: { data: FinanceData; balances: Record<string, number>; onAdd: () => void }) { return <section className="page-content"><div className="section-row"><p>Dompet dapat mewakili kategori dana dan rekening fisik yang menyimpannya.</p><button className="button" onClick={onAdd}><Plus size={16}/> Tambah dompet</button></div><div className="wallet-grid">{data.wallets.map((wallet) => <section className="card wallet-card" key={wallet.id}><span className="wallet-color" style={{ background: wallet.color }} /><p className="eyebrow">{wallet.account}</p><h2>{wallet.name}</h2><strong>{rupiah.format(balances[wallet.id] ?? 0)}</strong></section>)}</div></section>; }
function Settings({ data, clientId, spreadsheetId, connected, busy, setClientId, setSpreadsheetId, connect, createSheet, sync, onSaveType }: { data: FinanceData; clientId: string; spreadsheetId: string; connected: boolean; busy: boolean; setClientId: (value: string) => void; setSpreadsheetId: (value: string) => void; connect: () => void; createSheet: () => void; sync: (direction: "read" | "write") => void; onSaveType: (id: string, name: string, allocation: Record<string, number>) => void }) { return <section className="page-content settings"><section className="card connection"><div className="card-header"><div><h2><Cloud size={18}/> Google Sheets</h2><p>Data tersimpan di spreadsheet pribadi Anda.</p></div><span className={connected ? "status connected" : "status"}>{connected ? "Terhubung" : "Belum terhubung"}</span></div><div className="form-grid"><Field label="OAuth Client ID"><input value={clientId} placeholder="...apps.googleusercontent.com" onChange={(event) => setClientId(event.target.value)}/></Field><Field label="Spreadsheet ID"><input value={spreadsheetId} placeholder="ID dari URL spreadsheet" onChange={(event) => setSpreadsheetId(event.target.value)}/></Field></div><div className="form-actions"><button className="button" onClick={connect} disabled={busy}>{connected ? "Hubungkan ulang" : "Hubungkan Google"}</button><button className="button outline" onClick={createSheet} disabled={busy || !connected}>Buat spreadsheet baru</button><button className="button ghost" onClick={() => void sync("write")} disabled={busy || !connected || !spreadsheetId}>Simpan ke Sheets</button></div></section><section className="card"><div className="card-header"><div><h2>Alokasi dana masuk</h2><p>Pengaturan baru tidak mengubah pemasukan yang telah tercatat.</p></div></div>{data.incomeTypes.map((incomeType) => <AllocationEditor key={incomeType.id} type={incomeType} wallets={data.wallets} onSave={onSaveType}/>)}</section></section>; }
function AllocationEditor({ type, wallets, onSave }: { type: IncomeType; wallets: Wallet[]; onSave: (id: string, name: string, allocations: Record<string, number>) => void }) { const [name, setName] = useState(type.name); const [allocation, setAllocation] = useState(type.allocations); const total = allocationTotal({ ...type, allocations: allocation }); return <div className="allocation-editor"><div className="allocation-heading"><input className="input-title" value={name} onChange={(event) => setName(event.target.value)}/><span className={total === 100 ? "total valid" : "total invalid"}>{total}%</span></div><div className="allocation-grid">{wallets.map((wallet) => <label key={wallet.id}><span><i style={{ background: wallet.color }}/>{wallet.name}</span><div className="percent-input"><input type="number" min="0" max="100" value={allocation[wallet.id] ?? 0} onChange={(event) => setAllocation({ ...allocation, [wallet.id]: Number(event.target.value) || 0 })}/><b>%</b></div></label>)}</div><button className="button outline small" disabled={total !== 100} onClick={() => onSave(type.id, name, allocation)}>Simpan alokasi</button></div>; }
function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button className="close" onClick={onClose}>×</button></div>{children}</section></div>; }
function IncomeModal({ data, onClose, onSubmit }: { data: FinanceData; onClose: () => void; onSubmit: (form: FormData) => void }) { const [typeId, setTypeId] = useState(data.incomeTypes[0]?.id ?? ""); const [amount, setAmount] = useState(0); const type = data.incomeTypes.find((item) => item.id === typeId); return <ModalShell title="Catat dana masuk" onClose={onClose}><form action={(form) => onSubmit(form)}><Field label="Tipe pemasukan"><select name="incomeType" value={typeId} onChange={(event) => setTypeId(event.target.value)}>{data.incomeTypes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field><Field label="Nominal"><input name="amount" inputMode="numeric" placeholder="10000000" onChange={(event) => setAmount(inputNumber(event.target.value))} required/></Field><Field label="Tanggal"><input name="date" type="date" defaultValue={today} required/></Field><Field label="Catatan"><input name="note" placeholder="Contoh: Gaji September"/></Field>{type && amount > 0 && <div className="allocation-preview"><p>Preview alokasi</p>{splitIncome(amount, type).map(({ walletId, amount: split }) => <span key={walletId}>{data.wallets.find((wallet) => wallet.id === walletId)?.name}<strong>{rupiah.format(split)}</strong></span>)}</div>}<div className="modal-actions"><button type="button" className="button ghost" onClick={onClose}>Batal</button><button className="button" disabled={!type || !isValidAllocation(type)}>Simpan</button></div></form></ModalShell>; }
function ExpenseModal({ data, balances, onClose, onSubmit }: { data: FinanceData; balances: Record<string, number>; onClose: () => void; onSubmit: (form: FormData) => void }) { return <ModalShell title="Catat pengeluaran" onClose={onClose}><form action={(form) => onSubmit(form)}><WalletSelect data={data} name="walletId" balances={balances}/><Field label="Nominal"><input name="amount" inputMode="numeric" placeholder="800000" required/></Field><Field label="Tanggal"><input name="date" type="date" defaultValue={today} required/></Field><Field label="Catatan"><input name="note" placeholder="Contoh: Belanja grocery"/></Field><div className="modal-actions"><button type="button" className="button ghost" onClick={onClose}>Batal</button><button className="button">Simpan</button></div></form></ModalShell>; }
function TransferModal({ data, balances, onClose, onSubmit }: { data: FinanceData; balances: Record<string, number>; onClose: () => void; onSubmit: (form: FormData) => void }) { return <ModalShell title="Pindah saldo" onClose={onClose}><form action={(form) => onSubmit(form)}><WalletSelect data={data} name="from" label="Dari dompet" balances={balances}/><WalletSelect data={data} name="to" label="Ke dompet" balances={balances}/><Field label="Nominal"><input name="amount" inputMode="numeric" placeholder="500000" required/></Field><Field label="Tanggal"><input name="date" type="date" defaultValue={today} required/></Field><Field label="Catatan"><input name="note" placeholder="Contoh: Top up belanja"/></Field><div className="modal-actions"><button type="button" className="button ghost" onClick={onClose}>Batal</button><button className="button">Pindahkan</button></div></form></ModalShell>; }
function WalletModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (form: FormData) => void }) { return <ModalShell title="Tambah dompet" onClose={onClose}><form action={(form) => onSubmit(form)}><Field label="Nama dompet"><input name="name" placeholder="Contoh: Dana darurat" required/></Field><Field label="Rekening atau e-wallet"><input name="account" placeholder="Contoh: BCA" required/></Field><Field label="Warna"><input name="color" type="color" defaultValue="#2563eb"/></Field><div className="modal-actions"><button type="button" className="button ghost" onClick={onClose}>Batal</button><button className="button">Tambah</button></div></form></ModalShell>; }
function WalletSelect({ data, balances, name, label = "Dompet" }: { data: FinanceData; balances: Record<string, number>; name: string; label?: string }) { return <Field label={label}><select name={name}>{data.wallets.map((wallet) => <option value={wallet.id} key={wallet.id}>{wallet.name} · {rupiah.format(balances[wallet.id] ?? 0)}</option>)}</select></Field>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Empty({ label }: { label: string }) { return <div className="empty">{label}</div>; }

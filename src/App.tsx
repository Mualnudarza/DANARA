import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BarChart3, LogOut, Plus, RefreshCw, Settings2, WalletCards } from "lucide-react";
import { supabase, loadFinanceData } from "./lib/supabase";
import { allocationTotal, calculateBalances, dashboardSummary, isValidAllocation, newTransfer, rupiah, splitIncome } from "./lib/finance";
import type { FinanceData, IncomeType, Wallet } from "./lib/types";
import type { User } from "@supabase/supabase-js";

const today = new Date().toISOString().slice(0, 10);
type View = "dashboard" | "wallets" | "settings";
type Modal = "income" | "expense" | "transfer" | null;

const viewTitles: Record<View, string> = { dashboard: "Dashboard", wallets: "Dompet", settings: "Pengaturan" };

function inputNumber(value: string) {
  return Number(value.replace(/\D/g, "")) || 0;
}

export default function App() {
  const [data, setData] = useState<FinanceData>({ wallets: [], incomeTypes: [], entries: [], allocations: [] });
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [modal, setModal] = useState<Modal>(null);
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
      <div className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">Manajemen keuangan personal</p>
          <h1>Danara</h1>
          <p>Masuk untuk memulai.</p>
          <button className="button primary" onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}${import.meta.env.BASE_URL}` } })}>
            Masuk dengan Google
          </button>
        </div>
      </div>
    );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <span>Danara</span>
        </div>
        <nav>
          <button className={view === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => setView("dashboard")}>
            <BarChart3 size={18} />
            Dashboard
          </button>
          <button className={view === "wallets" ? "nav-item active" : "nav-item"} onClick={() => setView("wallets")}>
            <WalletCards size={18} />
            Dompet
          </button>
          <button className={view === "settings" ? "nav-item active" : "nav-item"} onClick={() => setView("settings")}>
            <Settings2 size={18} />
            Pengaturan
          </button>
        </nav>
        <button className="nav-item logout" onClick={() => void supabase.auth.signOut()}>
          <LogOut size={18} />
          Keluar
        </button>
        <div className="sidebar-bottom">
          <p className="eyebrow">Total saldo</p>
          <strong>{rupiah.format(summary.totalBalance)}</strong>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Keuangan personal</p>
            <h1>{viewTitles[view]}</h1>
          </div>
          <div className="top-actions">
            <button className="button secondary" title="Muat ulang data terbaru dari Supabase" onClick={() => void refresh()} disabled={busy}>
              <RefreshCw size={16} />
              {busy ? "Memuat…" : "Refresh data"}
            </button>
            <button className="button secondary" onClick={() => setModal("expense")}>
              <ArrowUpRight size={16} />
              Dana keluar
            </button>
            <button className="button secondary" onClick={() => setModal("transfer")}>
              <ArrowLeftRight size={16} />
              Pindah saldo
            </button>
            <button className="button primary" onClick={() => setModal("income")}>
              <Plus size={16} />
              Dana masuk
            </button>
          </div>
        </header>
        {message && (
          <div className="notice" role="status">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}
        <section className="page-content">
          {view === "dashboard" && <Dashboard data={data} summary={summary} balances={balances} setModal={setModal} />}
          {view === "wallets" && <WalletList data={data} balances={balances} addWallet={addWallet} updateWallet={updateWallet} deleteWallet={(id) => void deleteWallet(id)} />}
          {view === "settings" && <SettingsPage data={data} addIncomeType={addIncomeType} updateIncomeType={updateIncomeType} deleteIncomeType={(id) => void deleteIncomeType(id)} />}
        </section>
      </main>
      {modal === "income" && <IncomeModal data={data} onClose={() => setModal(null)} onSubmit={addIncome} />}
      {modal === "expense" && <ExpenseModal data={data} balances={balances} onClose={() => setModal(null)} onSubmit={addExpense} />}
      {modal === "transfer" && <TransferModal data={data} balances={balances} onClose={() => setModal(null)} onSubmit={transfer} />}
    </div>
  );
}

function Dashboard({ data, summary, balances, setModal }: { data: FinanceData; summary: ReturnType<typeof dashboardSummary>; balances: Record<string, number>; setModal: (value: Modal) => void }) {
  const recent = [...data.entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const max = Math.max(...Object.values(balances), 1);
  return (
    <div className="dashboard-view">
      <div className="stats">
        <StatCard label="Total saldo" value={rupiah.format(summary.totalBalance)} />
        <StatCard label="Pemasukan bulan ini" value={rupiah.format(summary.monthIncome)} />
        <StatCard label="Pengeluaran bulan ini" value={rupiah.format(summary.monthExpense)} />
        <StatCard label="Net bulan ini" value={rupiah.format(summary.monthIncome - summary.monthExpense)} />
      </div>
      <div className="grid-two">
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Saldo per dompet</h2>
              <p>Akumulasi seluruh transaksi</p>
            </div>
          </div>
          {data.wallets.length === 0 ? (
            <Empty label="Belum ada dompet. Tambahkan di menu Dompet." />
          ) : (
            <div className="wallet-bars">
              {data.wallets.map((wallet) => (
                <div className="wallet-bar" key={wallet.id}>
                  <div className="bar-label">
                    <span>
                      <i style={{ background: wallet.color }} />
                      {wallet.name}
                      <small>{wallet.account}</small>
                    </span>
                    <strong>{rupiah.format(balances[wallet.id] ?? 0)}</strong>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(0, ((balances[wallet.id] ?? 0) / max) * 100)}%`, background: wallet.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Catat transaksi</h2>
              <p>Saldo berubah saat disimpan</p>
            </div>
          </div>
          <button className="quick-action" onClick={() => setModal("income")}>
            <span className="icon success"><ArrowDownLeft size={16} /></span>
            <span><strong>Dana masuk</strong><small>Bagi otomatis menurut alokasi</small></span>
            <Plus size={18} />
          </button>
          <button className="quick-action" onClick={() => setModal("expense")}>
            <span className="icon danger"><ArrowUpRight size={16} /></span>
            <span><strong>Dana keluar</strong><small>Kurangi satu dompet</small></span>
            <Plus size={18} />
          </button>
          <button className="quick-action" onClick={() => setModal("transfer")}>
            <span className="icon neutral"><ArrowLeftRight size={16} /></span>
            <span><strong>Pindah saldo</strong><small>Antar-dompet, total tetap</small></span>
            <Plus size={18} />
          </button>
        </section>
      </div>
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Transaksi terakhir</h2>
            <p>{recent.length ? "Riwayat perubahan saldo" : "Belum ada transaksi"}</p>
          </div>
        </div>
        {recent.length === 0 ? (
          <Empty label="Catat dana masuk pertama untuk melihat riwayat." />
        ) : (
          <div className="transaction-list">
            {recent.map((entry) => {
              const wallet = data.wallets.find((item) => item.id === entry.walletId);
              const outgoing = entry.kind === "expense" || entry.kind === "transfer-out";
              return (
                <div className="transaction" key={entry.id}>
                  <span className={outgoing ? "transaction-icon out" : "transaction-icon in"}>
                    {outgoing ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </span>
                  <span className="transaction-info">
                    <strong>{entry.note}</strong>
                    <small>{entry.date} · {wallet?.name ?? "Dompet dihapus"}</small>
                  </span>
                  <strong className={outgoing ? "amount out" : "amount in"}>{outgoing ? "−" : "+"}{rupiah.format(entry.amount)}</strong>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="empty">{label}</div>;
}

function WalletList({ data, balances, addWallet, updateWallet, deleteWallet }: { data: FinanceData; balances: Record<string, number>; addWallet: (form: FormData) => void; updateWallet: (wallet: Wallet) => void; deleteWallet: (id: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <div className="wallets-view">
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Dompet</h2>
            <p>Kelola dompet dan label rekening/e-wallet.</p>
          </div>
        </div>
        {data.wallets.length === 0 ? (
          <Empty label="Belum ada dompet. Tambahkan dompet pertama di bawah." />
        ) : (
          <div className="wallet-cards">
            {data.wallets.map((wallet) =>
              editingId === wallet.id ? (
                <WalletEditForm key={wallet.id} wallet={wallet} onCancel={() => setEditingId(null)} onSave={(next) => { updateWallet(next); setEditingId(null); }} />
              ) : (
                <div className="wallet-card" key={wallet.id}>
                  <span className="wallet-color" style={{ background: wallet.color }} />
                  <p className="eyebrow">{wallet.account || "Tanpa label rekening"}</p>
                  <h3>{wallet.name}</h3>
                  <strong>{rupiah.format(balances[wallet.id] ?? 0)}</strong>
                  <div className="card-actions">
                    <button className="button secondary small" type="button" onClick={() => setEditingId(wallet.id)}>Edit</button>
                    <button className="button danger small" type="button" onClick={() => deleteWallet(wallet.id)}>Hapus</button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Tambah dompet</h2>
            <p>Dompet baru langsung bisa dipakai di semua form.</p>
          </div>
        </div>
        <form action={(form) => addWallet(form)}>
          <label className="field">
            <span>Nama dompet</span>
            <input name="name" placeholder="Contoh: Dana darurat" required />
          </label>
          <label className="field">
            <span>Rekening atau e-wallet</span>
            <input name="account" placeholder="Contoh: BCA" />
          </label>
          <label className="field">
            <span>Warna</span>
            <input name="color" type="color" defaultValue="#2563eb" />
          </label>
          <button className="button primary" type="submit">Tambah dompet</button>
        </form>
      </section>
    </div>
  );
}

function WalletEditForm({ wallet, onSave, onCancel }: { wallet: Wallet; onSave: (wallet: Wallet) => void; onCancel: () => void }) {
  const [name, setName] = useState(wallet.name);
  const [account, setAccount] = useState(wallet.account);
  const [color, setColor] = useState(wallet.color);
  return (
    <form
      className="wallet-card editing"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...wallet, name, account, color });
      }}
    >
      <label className="field">
        <span>Nama dompet</span>
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label className="field">
        <span>Rekening atau e-wallet</span>
        <input value={account} onChange={(event) => setAccount(event.target.value)} />
      </label>
      <label className="field">
        <span>Warna</span>
        <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
      </label>
      <div className="card-actions">
        <button className="button primary small" type="submit">Simpan</button>
        <button className="button secondary small" type="button" onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}

function SettingsPage({ data, addIncomeType, updateIncomeType, deleteIncomeType }: { data: FinanceData; addIncomeType: (name: string) => void; updateIncomeType: (type: IncomeType) => void; deleteIncomeType: (id: string) => void }) {
  const [newName, setNewName] = useState("");
  return (
    <div className="settings-view">
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Tambah tipe pemasukan</h2>
            <p>Setelah ditambahkan, atur persentase tiap dompet hingga total 100%.</p>
          </div>
        </div>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            addIncomeType(newName);
            setNewName("");
          }}
        >
          <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Contoh: Gaji Bulanan" />
          <button className="button primary" type="submit">Tambah tipe</button>
        </form>
      </section>
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Pengaturan alokasi</h2>
            <p>Perubahan hanya dipakai pemasukan baru. Riwayat tidak berubah.</p>
          </div>
        </div>
        {data.incomeTypes.length === 0 && <Empty label="Belum ada tipe pemasukan." />}
        {data.incomeTypes.map((incomeType) => (
          <AllocationEditor key={incomeType.id} type={incomeType} wallets={data.wallets} onSave={updateIncomeType} onDelete={deleteIncomeType} />
        ))}
      </section>
    </div>
  );
}

function AllocationEditor({ type, wallets, onSave, onDelete }: { type: IncomeType; wallets: Wallet[]; onSave: (type: IncomeType) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState(type.name);
  const [allocation, setAllocation] = useState<Record<string, number>>(type.allocations);
  const total = allocationTotal({ ...type, name, allocations: allocation });
  return (
    <div className="allocation-editor">
      <div className="allocation-heading">
        <input className="input-title" value={name} onChange={(event) => setName(event.target.value)} aria-label="Nama tipe" />
        <span className={total === 100 ? "total valid" : "total invalid"}>{total}%</span>
      </div>
      {wallets.length === 0 ? (
        <Empty label="Tambahkan dompet dulu agar alokasi bisa diatur." />
      ) : (
        <div className="allocation-grid">
          {wallets.map((wallet) => (
            <label key={wallet.id}>
              <span>
                <i style={{ background: wallet.color }} />
                {wallet.name}
              </span>
              <div className="percent-input">
                <input type="number" min={0} max={100} value={allocation[wallet.id] ?? 0} onChange={(event) => setAllocation({ ...allocation, [wallet.id]: Number(event.target.value) || 0 })} />
                <b>%</b>
              </div>
            </label>
          ))}
        </div>
      )}
      <div className="card-actions">
        <button className="button primary small" type="button" disabled={total !== 100 || !name.trim()} onClick={() => onSave({ ...type, name, allocations: allocation })} title={total !== 100 ? "Total harus tepat 100%" : "Simpan alokasi"}>
          Simpan alokasi
        </button>
        <button className="button danger small" type="button" onClick={() => onDelete(type.id)}>Hapus tipe</button>
      </div>
    </div>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close" type="button" onClick={onClose}>×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function WalletSelect({ data, balances, name, label = "Dompet" }: { data: FinanceData; balances: Record<string, number>; name: string; label?: string }) {
  return (
    <Field label={label}>
      <select name={name} required>
        {data.wallets.map((wallet) => (
          <option value={wallet.id} key={wallet.id}>
            {wallet.name} · {rupiah.format(balances[wallet.id] ?? 0)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function IncomeModal({ data, onClose, onSubmit }: { data: FinanceData; onClose: () => void; onSubmit: (form: FormData) => void }) {
  const [typeId, setTypeId] = useState(data.incomeTypes[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const type = data.incomeTypes.find((item) => item.id === typeId);
  return (
    <ModalShell title="Catat dana masuk" onClose={onClose}>
      <form action={(form) => onSubmit(form)}>
        <Field label="Tipe pemasukan">
          <select name="incomeType" value={typeId} onChange={(event) => setTypeId(event.target.value)} required>
            {data.incomeTypes.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Nominal">
          <input name="amount" inputMode="numeric" placeholder="10000000" onChange={(event) => setAmount(inputNumber(event.target.value))} required />
        </Field>
        <Field label="Tanggal">
          <input name="date" type="date" defaultValue={today} required />
        </Field>
        <Field label="Catatan">
          <input name="note" placeholder="Contoh: Gaji September" />
        </Field>
        {type && amount > 0 && (
          <div className="allocation-preview">
            <p>Preview alokasi</p>
            {splitIncome(amount, type).map(({ walletId, amount: split }) => (
              <span key={walletId}>
                {data.wallets.find((wallet) => wallet.id === walletId)?.name}
                <strong>{rupiah.format(split)}</strong>
              </span>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Batal</button>
          <button className="button primary" disabled={!type || !isValidAllocation(type)}>Simpan</button>
        </div>
      </form>
    </ModalShell>
  );
}

function ExpenseModal({ data, balances, onClose, onSubmit }: { data: FinanceData; balances: Record<string, number>; onClose: () => void; onSubmit: (form: FormData) => void }) {
  return (
    <ModalShell title="Catat dana keluar" onClose={onClose}>
      <form action={(form) => onSubmit(form)}>
        <WalletSelect data={data} name="walletId" balances={balances} />
        <Field label="Nominal">
          <input name="amount" inputMode="numeric" placeholder="800000" required />
        </Field>
        <Field label="Tanggal">
          <input name="date" type="date" defaultValue={today} required />
        </Field>
        <Field label="Catatan">
          <input name="note" placeholder="Contoh: Belanja grocery" />
        </Field>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Batal</button>
          <button className="button primary">Simpan</button>
        </div>
      </form>
    </ModalShell>
  );
}

function TransferModal({ data, balances, onClose, onSubmit }: { data: FinanceData; balances: Record<string, number>; onClose: () => void; onSubmit: (form: FormData) => void }) {
  return (
    <ModalShell title="Pindah saldo" onClose={onClose}>
      <form action={(form) => onSubmit(form)}>
        <WalletSelect data={data} name="from" label="Dari dompet" balances={balances} />
        <WalletSelect data={data} name="to" label="Ke dompet" balances={balances} />
        <Field label="Nominal">
          <input name="amount" inputMode="numeric" placeholder="500000" required />
        </Field>
        <Field label="Tanggal">
          <input name="date" type="date" defaultValue={today} required />
        </Field>
        <Field label="Catatan">
          <input name="note" placeholder="Contoh: Top up belanja" />
        </Field>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Batal</button>
          <button className="button primary">Pindahkan</button>
        </div>
      </form>
    </ModalShell>
  );
}

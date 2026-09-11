import { useState } from "react";
import { ArrowLeftRight, ArrowUpRight, BarChart3, History, LogOut, Menu, Plus, RefreshCw, Settings2, WalletCards, X } from "lucide-react";
import { rupiah } from "../../lib/finance";
import type { ModalKind, UserLike, View } from "./types";

const navItems: { key: View; label: string; icon: typeof BarChart3 }[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "wallets", label: "Dompet", icon: WalletCards },
  { key: "history", label: "Riwayat", icon: History },
  { key: "settings", label: "Pengaturan", icon: Settings2 },
];

const viewTitles: Record<View, string> = {
  dashboard: "Dashboard",
  wallets: "Dompet",
  history: "Riwayat transaksi",
  settings: "Pengaturan alokasi",
};

export default function AppLayout({ view, setView, setModal, user, totalBalance, busy, message, clearMessage, refresh, signOut, children }: {
  view: View;
  setView: (view: View) => void;
  setModal: (modal: ModalKind) => void;
  user: UserLike;
  totalBalance: number;
  busy: boolean;
  message: string;
  clearMessage: () => void;
  refresh: () => void;
  signOut: () => void;
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const displayName = user.user_metadata?.full_name || user.email || "Pengguna";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  const nav = (
    <>
      {navItems.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => { setView(key); setDrawer(false); }}
          className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${view === key ? "border-line bg-white font-semibold text-ink-900 shadow-sm" : "border-transparent text-ink-500 hover:bg-slate-100 hover:text-ink-900"}`}
        >
          <Icon size={18} className="shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </>
  );

  return (
    <div className="min-h-screen">
      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={() => setDrawer(true)} aria-label="Buka menu" className="rounded-lg border border-line p-2 text-ink-700"><Menu size={18} /></button>
          <span className="flex items-center gap-2 font-extrabold tracking-tight text-ink-900">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-900 text-sm text-white">D</span>
            Danara
          </span>
          <span className="tabular ml-auto text-sm font-bold text-ink-900">{rupiah.format(totalBalance)}</span>
        </div>
      </div>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <div className="absolute inset-0 bg-ink-900/30" onClick={() => setDrawer(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-4 bg-zinc-50 p-4">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-ink-900">Menu</span>
              <button onClick={() => setDrawer(false)} aria-label="Tutup menu" className="rounded-lg border border-line p-1.5"><X size={16} /></button>
            </div>
            <nav className="grid gap-1.5">{nav}</nav>
            <button onClick={signOut} className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-slate-100">
              <LogOut size={18} /> Keluar
            </button>
          </aside>
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-zinc-50 px-4 pb-4 pt-5 lg:flex">
          <a href="#" className="flex items-center gap-2 px-2 py-3 font-extrabold tracking-tight text-ink-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-base text-white">D</span>
            Danara
          </a>
          <nav className="mt-2 grid gap-1.5">{nav}</nav>
          <div className="mt-auto grid gap-2">
            <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Total saldo</p>
              <p className="tabular text-lg font-extrabold tracking-tight text-ink-900">{rupiah.format(totalBalance)}</p>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              {avatar ? <img src={avatar} alt="" className="h-8 w-8 rounded-full" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-bold text-ink-700">{displayName.slice(0, 1).toUpperCase()}</span>}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-700">{displayName}</span>
              <button onClick={signOut} aria-label="Keluar" title="Keluar" className="rounded-md p-1.5 text-ink-500 hover:bg-slate-200"><LogOut size={16} /></button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
              <div className="mr-auto">
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Keuangan personal</p>
                <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">{viewTitles[view]}</h1>
              </div>
              <button onClick={refresh} disabled={busy} title="Muat ulang data terbaru dari Supabase" className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
                {busy ? "Memuat…" : "Refresh"}
              </button>
              <button onClick={() => setModal("expense")} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50">
                <ArrowUpRight size={15} /> Dana keluar
              </button>
              <button onClick={() => setModal("transfer")} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50">
                <ArrowLeftRight size={15} /> Pindah saldo
              </button>
              <button onClick={() => setModal("income")} className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white hover:bg-ink-700">
                <Plus size={15} /> Dana masuk
              </button>
            </div>
          </header>

          {message && (
            <div className="px-4 pt-4 sm:px-6" role="status">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
                <span>{message}</span>
                <button onClick={clearMessage} aria-label="Tutup pesan" className="text-lg leading-none">×</button>
              </div>
            </div>
          )}

          <main className="px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>

          {/* Bottom nav for phones */}
          <nav className="sticky bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-line bg-surface px-2 py-2 lg:hidden">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setView(key)} className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium ${view === key ? "text-ink-900" : "text-ink-500"}`}>
                <Icon size={19} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

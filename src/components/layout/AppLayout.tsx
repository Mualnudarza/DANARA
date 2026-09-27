import { useState } from "react";
import { ArrowLeftRight, ArrowUpRight, BarChart3, CalendarDays, Cloud, Gem, Handshake, History, LogIn, LogOut, Menu, Plus, RefreshCw, Settings2, WalletCards, X } from "lucide-react";
import { rupiah } from "../../lib/finance";
import type { ModalKind, UserLike, View } from "./types";
import Toast from "../ui/Toast";

const navItems: { key: View; label: string; icon: typeof BarChart3 }[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "wallets", label: "Dompet", icon: WalletCards },
  { key: "assets", label: "Aset", icon: Gem },
  { key: "debts", label: "Hutang", icon: Handshake },
  { key: "history", label: "Riwayat", icon: History },
  { key: "calendar", label: "Kalender", icon: CalendarDays },
  { key: "settings", label: "Pengaturan", icon: Settings2 },
];

const mobileBottomNav: { key: View; label: string; icon: typeof BarChart3 }[] = [
  { key: "dashboard", label: "Beranda", icon: BarChart3 },
  { key: "wallets", label: "Dompet", icon: WalletCards },
  { key: "history", label: "Riwayat", icon: History },
  { key: "debts", label: "Hutang", icon: Handshake },
];

const viewTitles: Record<View, string> = {
  dashboard: "Dashboard",
  wallets: "Dompet",
  assets: "Pencatatan aset",
  debts: "Hutang & piutang",
  history: "Riwayat transaksi",
  calendar: "Kalender transaksi",
  settings: "Pengaturan alokasi",
};

export default function AppLayout({
  view,
  setView,
  setModal,
  user,
  totalBalance,
  busy,
  message,
  clearMessage,
  refresh,
  signOut,
  signInGoogle,
  children,
}: {
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
  signInGoogle?: () => void;
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const [mobileFabOpen, setMobileFabOpen] = useState(false);
  const displayName = user.user_metadata?.full_name || user.email || "Pengguna Lokal";
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const isLocal = user.isLocal ?? false;

  return (
    <div className="min-h-screen bg-canvas text-ink-900">
      {/* Mobile Single Header: height 54px, sticky top-0, no collision */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Buka menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-700 active:bg-slate-100"
          >
            <Menu size={18} />
          </button>
          <div>
            <h1 className="text-sm font-bold leading-tight text-ink-900">{viewTitles[view]}</h1>
            <p className="text-[10px] text-ink-500">{isLocal ? "Mode Lokal (Offline)" : "Cloud Terhubung"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={busy}
            aria-label="Refresh data"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-700 active:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
          </button>
          <div className="rounded-lg border border-line bg-slate-50 px-2.5 py-1 text-right">
            <span className="tabular block text-xs font-bold text-ink-900">{rupiah.format(totalBalance)}</span>
          </div>
        </div>
      </header>

      {/* Slide-over Drawer (Mobile & Tablet) */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-xs" onClick={() => setDrawer(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-4 bg-zinc-50 p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="flex items-center gap-2 font-extrabold tracking-tight text-ink-900">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-900 text-sm font-bold text-white">D</span>
                Danara
              </span>
              <button
                onClick={() => setDrawer(false)}
                aria-label="Tutup menu"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-700 active:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="grid gap-1">
              {navItems.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setView(key); setDrawer(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    view === key ? "border border-line bg-white font-semibold text-ink-900 shadow-xs" : "text-ink-600 active:bg-slate-100"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto border-t border-line pt-3">
              {isLocal ? (
                <div className="grid gap-2">
                  <div className="rounded-lg border border-line bg-white p-2.5 text-xs">
                    <p className="font-semibold text-ink-800">Mode Lokal (Offline)</p>
                    <p className="mt-0.5 text-[11px] text-ink-500">Data tersimpan di perangkat ini tanpa perlu login.</p>
                  </div>
                  {signInGoogle && (
                    <button
                      onClick={() => { setDrawer(false); signInGoogle(); }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white active:bg-ink-700"
                    >
                      <Cloud size={14} /> Hubungkan Akun Google
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-2">
                  <div className="flex items-center gap-2.5 rounded-lg border border-line bg-white p-2">
                    {avatar ? (
                      <img src={avatar} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-bold text-ink-700">
                        {displayName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1 truncate text-xs font-medium text-ink-800">
                      <p className="truncate font-semibold">{displayName}</p>
                      <p className="truncate text-[10px] text-ink-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setDrawer(false); signOut(); }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-700 active:bg-slate-100"
                  >
                    <LogOut size={14} /> Keluar (Pakai Mode Lokal)
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Desktop Sidebar (Minimal, Clean) */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-zinc-50 px-3 pb-4 pt-5 lg:flex">
          <a href="#" className="flex items-center gap-2 px-2 py-2 font-extrabold tracking-tight text-ink-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-base font-bold text-white">D</span>
            Danara
          </a>

          <nav className="mt-4 grid gap-1">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  view === key ? "border border-line bg-white font-semibold text-ink-900 shadow-xs" : "text-ink-500 hover:bg-slate-100 hover:text-ink-900"
                }`}
              >
                <Icon size={17} className="shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto grid gap-2">
            <div className="rounded-lg border border-line bg-surface px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-ink-500">Total saldo</p>
              <p className="tabular text-base font-extrabold tracking-tight text-ink-900">{rupiah.format(totalBalance)}</p>
            </div>

            {isLocal ? (
              <div className="rounded-lg border border-line bg-surface p-2.5 text-center">
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-ink-700">Mode Lokal (Offline)</span>
                {signInGoogle && (
                  <button
                    onClick={signInGoogle}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-ink-900 px-2 py-1.5 text-xs font-semibold text-white hover:bg-ink-700"
                  >
                    <LogIn size={13} /> Masuk Google
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5">
                {avatar ? (
                  <img src={avatar} alt="" className="h-7 w-7 rounded-full" />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-xs font-bold text-ink-700">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-700">{displayName}</span>
                <button onClick={signOut} aria-label="Keluar" title="Keluar" className="rounded-md p-1 text-ink-500 hover:bg-slate-200">
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <div className="min-w-0 flex-1 pb-24 lg:pb-8">
          {/* Desktop Header */}
          <header className="sticky top-0 z-30 hidden border-b border-line bg-surface/95 px-6 py-4 backdrop-blur lg:block">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Keuangan personal</p>
                <h1 className="text-2xl font-bold tracking-tight text-ink-900">{viewTitles[view]}</h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refresh}
                  disabled={busy}
                  title="Muat ulang data"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
                  {busy ? "Memuat…" : "Refresh"}
                </button>
                <button
                  onClick={() => setModal("expense")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50"
                >
                  <ArrowUpRight size={15} /> Dana keluar
                </button>
                <button
                  onClick={() => setModal("transfer")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50"
                >
                  <ArrowLeftRight size={15} /> Pindah saldo
                </button>
                <button
                  onClick={() => setModal("income")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white hover:bg-ink-700"
                >
                  <Plus size={15} /> Dana masuk
                </button>
              </div>
            </div>
          </header>

          <main className="px-3.5 py-4 sm:px-6 sm:py-6">{children}</main>

          <Toast message={message} onClose={clearMessage} />

          {/* Mobile Speed Dial / FAB: bottom-right corner for fast 1-thumb entry */}
          <div className="fixed bottom-16 right-4 z-40 lg:hidden">
            {mobileFabOpen && (
              <div className="mb-2 grid gap-2">
                <button
                  onClick={() => { setMobileFabOpen(false); setModal("income"); }}
                  className="flex items-center justify-end gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-md active:bg-emerald-50"
                >
                  <span>+ Dana Masuk</span>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white"><Plus size={14} /></span>
                </button>
                <button
                  onClick={() => { setMobileFabOpen(false); setModal("expense"); }}
                  className="flex items-center justify-end gap-2 rounded-full border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 shadow-md active:bg-rose-50"
                >
                  <span>− Dana Keluar</span>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white"><ArrowUpRight size={14} /></span>
                </button>
                <button
                  onClick={() => { setMobileFabOpen(false); setModal("transfer"); }}
                  className="flex items-center justify-end gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-md active:bg-indigo-50"
                >
                  <span>⇄ Pindah Saldo</span>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-white"><ArrowLeftRight size={14} /></span>
                </button>
              </div>
            )}
            <button
              onClick={() => setMobileFabOpen(!mobileFabOpen)}
              aria-label="Catat transaksi cepat"
              className={`ml-auto grid h-13 w-13 place-items-center rounded-full text-white shadow-xl transition-transform active:scale-95 ${
                mobileFabOpen ? "rotate-45 bg-ink-700" : "bg-ink-900"
              }`}
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Mobile Bottom Navigation: 5 items, thumb-friendly touch targets */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-line bg-surface/98 px-2 backdrop-blur lg:hidden">
            {mobileBottomNav.map(({ key, label, icon: Icon }) => {
              const active = view === key;
              return (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-semibold transition-colors ${
                    active ? "text-ink-900" : "text-ink-500 active:text-ink-700"
                  }`}
                >
                  <Icon size={19} className={active ? "stroke-[2.4]" : "stroke-[1.8]"} />
                  <span className="mt-0.5 leading-none">{label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setDrawer(true)}
              className={`flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-semibold transition-colors ${
                view === "assets" || view === "calendar" || view === "settings" ? "text-ink-900" : "text-ink-500"
              }`}
            >
              <Menu size={19} className={view === "assets" || view === "calendar" || view === "settings" ? "stroke-[2.4]" : "stroke-[1.8]"} />
              <span className="mt-0.5 leading-none">Menu</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

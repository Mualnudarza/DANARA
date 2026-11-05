import { CalendarDays, ChevronRight, Cloud, Gem, Handshake, Settings2, ShieldCheck, WalletCards } from "lucide-react";
import { rupiah } from "../../lib/finance";
import type { UserLike, View } from "../layout/types";

interface MenuViewProps {
  setView: (view: View) => void;
  user: UserLike;
  totalBalance: number;
  assetsCount: number;
  activeDebtsCount: number;
}

export default function MenuView({
  setView,
  user,
  totalBalance,
  assetsCount,
  activeDebtsCount,
}: MenuViewProps) {
  const isLocal = user.isLocal ?? true;
  const displayName = user.user_metadata?.full_name || user.email || "Pengguna Lokal";

  const menuSections = [
    {
      key: "assets" as View,
      title: "Portofolio Aset",
      subtitle: `${assetsCount} aset aktif tercatat (emas, investasi, barang)`,
      icon: Gem,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      key: "debts" as View,
      title: "Hutang & Piutang",
      subtitle: `${activeDebtsCount} catatan kewajiban aktif`,
      icon: Handshake,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      key: "calendar" as View,
      title: "Kalender Transaksi",
      subtitle: "Visualisasi kalender mutasi kas bulanan",
      icon: CalendarDays,
      color: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      key: "settings" as View,
      title: "Pengaturan & Akun",
      subtitle: "Alokasi gaji, zona bahaya reset data, dan sinkronisasi",
      icon: Settings2,
      color: "bg-slate-100 text-slate-700 border-slate-200",
    },
  ];

  return (
    <div className="grid max-w-xl gap-4 sm:gap-5">
      {/* Profil Singkat & Status Kedaulatan Data */}
      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-900 text-sm font-bold text-white">
              D
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink-900">{displayName}</h2>
              <p className="flex items-center gap-1.5 text-xs text-ink-500">
                <Cloud size={12} />
                {isLocal ? "Mode Lokal (Offline pada perangkat ini)" : "Tersinkronisasi ke Cloud Supabase"}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-line bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
            {isLocal ? "Lokal" : "Cloud"}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-ink-500">Total Saldo Terkelola</span>
          <strong className="tabular text-sm font-bold text-ink-900">{rupiah.format(totalBalance)}</strong>
        </div>
      </section>

      {/* Daftar Modul Menu Utama */}
      <section className="rounded-xl border border-line bg-surface p-2 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] sm:p-3">
        <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
          Modul Keuangan
        </p>
        <div className="mt-1 divide-y divide-slate-100">
          {menuSections.map(({ key, title, subtitle, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors active:bg-slate-50 rounded-lg hover:bg-slate-50/80"
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${color}`}>
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink-900">{title}</h3>
                  <p className="text-xs text-ink-500">{subtitle}</p>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-ink-500" />
            </button>
          ))}
        </div>
      </section>

      {/* Info Kedaulatan & Keamanan */}
      <section className="rounded-xl border border-dashed border-line bg-slate-50/60 p-3.5 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-700">
          <ShieldCheck size={14} className="text-emerald-700" />
          Danara Keuangan Personal v1.1.0
        </p>
        <p className="mt-1 text-[11px] text-ink-500">
          Penyimpanan lokal instan berintegritas tinggi dengan proteksi pembulatan alokasi nol.
        </p>
      </section>
    </div>
  );
}

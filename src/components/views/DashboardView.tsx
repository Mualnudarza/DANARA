import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Gem, Handshake, Plus, Scale } from "lucide-react";
import { activeAssetsTotal, debtTotals, rupiah, targetProgress, walletTargetLookup } from "../../lib/finance";
import type { FinanceData, ModalKind } from "../../lib/types";
import type { dashboardSummary } from "../../lib/finance";
import { Empty } from "../ui/primitives";
import MetricCard from "../dashboard/MetricCard";
import LedgerTable from "../dashboard/LedgerTable";
import type { LedgerFilter } from "../../lib/types";

export default function DashboardView({
  data,
  summary,
  balances,
  filter,
  setFilter,
  setModal,
}: {
  data: FinanceData;
  summary: ReturnType<typeof dashboardSummary>;
  balances: Record<string, number>;
  filter: LedgerFilter;
  setFilter: (filter: LedgerFilter) => void;
  setModal: (modal: ModalKind) => void;
}) {
  const max = Math.max(...Object.values(balances), 1);
  const targets = walletTargetLookup(data.walletTargets);
  const totalAssets = activeAssetsTotal(data.assets);
  const debt = debtTotals(data.debts, data.debtPayments);
  const netMonthly = summary.monthIncome - summary.monthExpense;

  return (
    <div className="grid gap-4 sm:gap-5">
      {/* Mobile & Desktop Dual-Column Canvas */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-6">
        {/* Left Column: Financial Overview, KPIs, and Wallets */}
        <div className="grid gap-4 sm:gap-5">
          {/* Hero Saldo Banner */}
          <section className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-b from-surface to-slate-50/50 p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Total Saldo Terkelola</p>
              <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[10px] font-semibold text-ink-600">
                {data.wallets.length} Dompet
              </span>
            </div>
            <p className="tabular mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              {rupiah.format(summary.totalBalance)}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/60 pt-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-flow-in-bg text-flow-in-text">
                  <ArrowDownLeft size={14} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] text-ink-500">Masuk Bulan Ini</p>
                  <p className="tabular truncate text-xs font-bold text-flow-in-text">+{rupiah.format(summary.monthIncome)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-flow-out-bg text-flow-out-text">
                  <ArrowUpRight size={14} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] text-ink-500">Keluar Bulan Ini</p>
                  <p className="tabular truncate text-xs font-bold text-flow-out-text">−{rupiah.format(summary.monthExpense)}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Glanceable Metric Chips for Mobile (< sm) */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
              <Scale size={14} className="text-ink-500" />
              <span className="text-[11px] text-ink-500">Net:</span>
              <strong className={`tabular text-xs font-bold ${netMonthly >= 0 ? "text-flow-in-text" : "text-flow-out-text"}`}>
                {rupiah.format(netMonthly)}
              </strong>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
              <Gem size={14} className="text-amber-600" />
              <span className="text-[11px] text-ink-500">Aset:</span>
              <strong className="tabular text-xs font-bold text-ink-900">
                {rupiah.format(totalAssets)}
              </strong>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
              <Handshake size={14} className="text-indigo-600" />
              <span className="text-[11px] text-ink-500">Hutang Bersih:</span>
              <strong className={`tabular text-xs font-bold ${debt.net >= 0 ? "text-flow-in-text" : "text-flow-out-text"}`}>
                {rupiah.format(debt.net)}
              </strong>
            </div>
          </div>

          {/* Desktop/Tablet Metric Cards Grid (>= sm) */}
          <div className="hidden grid-cols-3 gap-3 sm:grid">
            <MetricCard
              label="Net bulan ini"
              value={rupiah.format(netMonthly)}
              tone={netMonthly >= 0 ? "in" : "out"}
              hint="Masuk − keluar"
            />
            <MetricCard
              label="Total aset"
              value={rupiah.format(totalAssets)}
              tone="in"
              hint={`${data.assets.filter((a) => a.status === "active").length} aset aktif`}
            />
            <MetricCard
              label="Hutang bersih"
              value={rupiah.format(debt.net)}
              tone={debt.net >= 0 ? "in" : "out"}
              hint={`Hutang ${rupiah.format(debt.owe)} · Piutang ${rupiah.format(debt.owed)}`}
            />
          </div>

          {/* Saldo per dompet */}
          <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink-900">Saldo per dompet</h2>
                <p className="mt-0.5 text-xs text-ink-500">Progres capaian target alokasi dompet</p>
              </div>
            </div>

            {data.wallets.length === 0 ? (
              <div className="mt-3"><Empty label="Belum ada dompet. Tambahkan di menu Dompet." /></div>
            ) : (
              <div className="mt-4 grid gap-3.5">
                {data.wallets.map((wallet) => {
                  const balance = balances[wallet.id] ?? 0;
                  const target = targets[wallet.id];
                  const hasTarget = typeof target === "number" && target > 0;
                  const prog = hasTarget ? targetProgress(balance, target) : null;
                  const barWidth = hasTarget ? prog!.pct : Math.max(0, (balance / max) * 100);

                  return (
                    <div key={wallet.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
                        <span className="flex min-w-0 items-center gap-1.5 font-medium text-ink-700">
                          <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: wallet.color }} />
                          <span className="truncate">{wallet.name}</span>
                          <small className="truncate text-ink-500">{wallet.account}</small>
                        </span>
                        <span className="shrink-0 text-right">
                          <strong className="tabular text-ink-900">{rupiah.format(balance)}</strong>
                          {hasTarget && (
                            <span className="tabular ml-1.5 text-[11px] text-ink-500">
                              / {rupiah.format(target)} ({prog!.rawPct}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full min-w-[3px] rounded-full transition-all"
                          style={{
                            width: `${barWidth}%`,
                            background: prog?.reached ? "#10b981" : wallet.color,
                          }}
                        />
                      </div>
                      {hasTarget && !prog!.reached && (
                        <p className="tabular mt-1 text-[10px] text-ink-500">Sisa {rupiah.format(prog!.remaining)} menuju target</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Quick Action Entry & Recent Transactions */}
        <div className="grid gap-4 sm:gap-5">
          {/* Quick Transaction Actions Card */}
          <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
            <h2 className="text-sm font-bold text-ink-900">Catat transaksi</h2>
            <p className="mt-0.5 text-xs text-ink-500">Pilih jenis mutasi kas untuk input cepat</p>
            <div className="mt-2 divide-y divide-slate-100">
              <button
                onClick={() => setModal("income")}
                className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-slate-50/80 active:bg-slate-100 rounded-lg px-2 -mx-2"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-flow-in-bg text-flow-in-text">
                  <ArrowDownLeft size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <strong className="block text-sm text-ink-900">Dana masuk</strong>
                  <small className="block text-xs text-ink-500 truncate">Bagi otomatis menurut alokasi dompet</small>
                </span>
                <Plus size={18} className="text-ink-500 shrink-0" />
              </button>
              <button
                onClick={() => setModal("expense")}
                className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-slate-50/80 active:bg-slate-100 rounded-lg px-2 -mx-2"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-flow-out-bg text-flow-out-text">
                  <ArrowUpRight size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <strong className="block text-sm text-ink-900">Dana keluar</strong>
                  <small className="block text-xs text-ink-500 truncate">Kurangi saldo satu dompet</small>
                </span>
                <Plus size={18} className="text-ink-500 shrink-0" />
              </button>
              <button
                onClick={() => setModal("transfer")}
                className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-slate-50/80 active:bg-slate-100 rounded-lg px-2 -mx-2"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-flow-move-bg text-flow-move-text">
                  <ArrowLeftRight size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <strong className="block text-sm text-ink-900">Pindah saldo</strong>
                  <small className="block text-xs text-ink-500 truncate">Antar-dompet, total saldo tetap</small>
                </span>
                <Plus size={18} className="text-ink-500 shrink-0" />
              </button>
            </div>
          </section>

          {/* Recent Ledger Entries */}
          <LedgerTable data={data} filter={filter} setFilter={setFilter} limit={8} />
        </div>
      </div>
    </div>
  );
}

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Plus } from "lucide-react";
import { activeAssetsTotal, debtTotals, rupiah, targetProgress, walletTargetLookup } from "../../lib/finance";
import type { FinanceData, ModalKind } from "../../lib/types";
import type { dashboardSummary } from "../../lib/finance";
import { Empty } from "../ui/primitives";
import MetricCard from "../dashboard/MetricCard";
import LedgerTable from "../dashboard/LedgerTable";
import type { LedgerFilter } from "../../lib/types";

export default function DashboardView({ data, summary, balances, filter, setFilter, setModal }: {
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

  return (
    <div className="grid gap-5">
      {/* 6 KPI Cards in 2 rows */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Total saldo" value={rupiah.format(summary.totalBalance)} hint="Akumulasi semua dompet" />
        <MetricCard label="Masuk bulan ini" value={rupiah.format(summary.monthIncome)} tone="in" hint="Dana masuk eksternal" />
        <MetricCard label="Keluar bulan ini" value={rupiah.format(summary.monthExpense)} tone="out" hint="Dana keluar eksternal" />
        <MetricCard label="Net bulan ini" value={rupiah.format(summary.monthIncome - summary.monthExpense)} hint="Masuk dikurangi keluar" />
        <MetricCard label="Total aset" value={rupiah.format(totalAssets)} tone="in" hint={`${data.assets.filter((a) => a.status === "active").length} aset aktif`} />
        <MetricCard
          label="Hutang bersih"
          value={rupiah.format(debt.net)}
          tone={debt.net >= 0 ? "in" : "out"}
          hint={`Hutangku ${rupiah.format(debt.owe)} · Piutang ${rupiah.format(debt.owed)}`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_0.85fr]">
        <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
          <h2 className="text-sm font-bold text-ink-900">Saldo per dompet</h2>
          <p className="mt-0.5 text-xs text-ink-500">Progres menunjukkan capaian target dompet jika diatur.</p>
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

        <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
          <h2 className="text-sm font-bold text-ink-900">Catat transaksi</h2>
          <p className="mt-0.5 text-xs text-ink-500">Saldo berubah saat disimpan</p>
          <div className="mt-2 divide-y divide-slate-100">
            <button onClick={() => setModal("income")} className="flex w-full items-center gap-2.5 py-3 text-left">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-flow-in-bg text-flow-in-text"><ArrowDownLeft size={16} /></span>
              <span className="flex-1"><strong className="block text-sm text-ink-900">Dana masuk</strong><small className="text-xs text-ink-500">Bagi otomatis menurut alokasi</small></span>
              <Plus size={18} className="text-ink-500" />
            </button>
            <button onClick={() => setModal("expense")} className="flex w-full items-center gap-2.5 py-3 text-left">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-flow-out-bg text-flow-out-text"><ArrowUpRight size={16} /></span>
              <span className="flex-1"><strong className="block text-sm text-ink-900">Dana keluar</strong><small className="text-xs text-ink-500">Kurangi satu dompet</small></span>
              <Plus size={18} className="text-ink-500" />
            </button>
            <button onClick={() => setModal("transfer")} className="flex w-full items-center gap-2.5 py-3 text-left">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-flow-move-bg text-flow-move-text"><ArrowLeftRight size={16} /></span>
              <span className="flex-1"><strong className="block text-sm text-ink-900">Pindah saldo</strong><small className="text-xs text-ink-500">Antar-dompet, total tetap</small></span>
              <Plus size={18} className="text-ink-500" />
            </button>
          </div>
        </section>
      </div>

      <LedgerTable data={data} filter={filter} setFilter={setFilter} limit={8} />
    </div>
  );
}

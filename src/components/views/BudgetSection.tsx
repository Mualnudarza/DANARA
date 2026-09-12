import { budgetSpent, budgetStatus, rupiah } from "../../lib/finance";
import type { FinanceData } from "../../lib/types";
import { Empty } from "../ui/primitives";

const inputCls = "h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-xs tabular text-right";

export default function BudgetSection({ data, month, setBudget }: { data: FinanceData; month: string; setBudget: (walletId: string, limit: number) => void }) {
  if (data.wallets.length === 0) return <Empty label="Tambahkan dompet dulu agar budget bisa diatur." />;
  return (
    <div className="grid gap-2">
      {data.wallets.map((wallet) => {
        const budget = data.budgets.find((item) => item.walletId === wallet.id && item.month === month);
        const spent = budgetSpent(data.entries, wallet.id, month);
        const info = budget ? budgetStatus(budget.limitAmount, spent) : null;
        const bar = !budget ? 0 : Math.min(100, info?.pct ?? 0);
        const barColor = !info || info.status === "safe" ? "bg-emerald-500" : info.status === "warning" ? "bg-amber-500" : "bg-rose-500";
        return (
          <div key={wallet.id} className="rounded-lg border border-line p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-700">
                <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: wallet.color }} />
                <span className="truncate">{wallet.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="Pagu"
                  defaultValue={budget?.limitAmount ?? ""}
                  key={`${wallet.id}-${month}-${budget?.limitAmount ?? "new"}`}
                  onBlur={(event) => {
                    const value = Number(event.target.value) || 0;
                    if (value > 0) setBudget(wallet.id, value);
                  }}
                  aria-label={`Pagu ${wallet.name}`}
                  className="h-8 w-28 rounded-md border border-line px-2 text-xs tabular text-right"
                />
                {info && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${info.status === "safe" ? "bg-flow-in-bg text-flow-in-text" : info.status === "warning" ? "bg-amber-100 text-amber-800" : "bg-flow-out-bg text-flow-out-text"}`}>
                    {info.pct}%
                  </span>
                )}
              </span>
            </div>
            {budget ? (
              <>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${bar}%` }} />
                </div>
                <p className="tabular mt-1.5 text-[11px] text-ink-500">
                  Terpakai {rupiah.format(spent)} dari {rupiah.format(budget.limitAmount)} · Sisa {rupiah.format(info?.remaining ?? 0)}
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-[11px] text-ink-500">Isi pagu untuk mulai memantau pengeluaran dompet ini.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { inputCls };

import { rupiah, targetProgress } from "../../lib/finance";
import type { Wallet } from "../../lib/types";

export default function WalletCard({
  wallet,
  balance,
  target,
  onEdit,
  onDelete,
  onSaveTarget,
}: {
  wallet: Wallet;
  balance: number;
  target?: number;
  onEdit: () => void;
  onDelete: () => void;
  onSaveTarget: (targetAmount: number) => void;
}) {
  const hasTarget = typeof target === "number" && target > 0;
  const prog = hasTarget ? targetProgress(balance, target) : null;

  return (
    <article className="relative overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: wallet.color }} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-ink-500">{wallet.account || "Tanpa rekening"}</p>
          <h3 className="truncate text-base font-bold tracking-tight text-ink-900">{wallet.name}</h3>
        </div>
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: wallet.color }} aria-hidden />
      </div>

      <p className="tabular mt-3 text-2xl font-extrabold tracking-tight text-ink-900">{rupiah.format(balance)}</p>

      {/* Target progress if set */}
      {hasTarget && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-500">Target: <strong className="tabular text-ink-900">{rupiah.format(target)}</strong></span>
            <span className={`tabular font-bold ${prog!.reached ? "text-emerald-600" : "text-ink-700"}`}>{prog!.rawPct}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${prog!.pct}%`,
                background: prog!.reached ? "#10b981" : wallet.color,
              }}
            />
          </div>
          {!prog!.reached && (
            <p className="tabular mt-1 text-[10px] text-ink-500">Sisa {rupiah.format(prog!.remaining)}</p>
          )}
        </div>
      )}

      {/* Inline target input */}
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <label className="text-[11px] font-medium text-ink-500">Pagu target:</label>
        <input
          type="number"
          min={0}
          placeholder="Atur target Rp"
          defaultValue={target ?? ""}
          key={`${wallet.id}-target-${target ?? "none"}`}
          onBlur={(e) => {
            const val = Number(e.target.value) || 0;
            onSaveTarget(val);
          }}
          aria-label={`Target saldo ${wallet.name}`}
          className="tabular h-7 w-28 rounded border border-line px-2 text-right text-xs"
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onEdit} className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-slate-50">Edit</button>
        <button type="button" onClick={onDelete} className="rounded-lg border border-flow-out-line bg-flow-out-bg px-2.5 py-1.5 text-xs font-semibold text-flow-out-text hover:brightness-95">Hapus</button>
      </div>
    </article>
  );
}

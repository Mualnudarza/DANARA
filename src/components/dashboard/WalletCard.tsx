import { rupiah } from "../../lib/finance";
import type { Wallet } from "../../lib/types";

export default function WalletCard({ wallet, balance, onEdit, onDelete }: { wallet: Wallet; balance: number; onEdit: () => void; onDelete: () => void }) {
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
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onEdit} className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-slate-50">Edit</button>
        <button type="button" onClick={onDelete} className="rounded-lg border border-flow-out-line bg-flow-out-bg px-2.5 py-1.5 text-xs font-semibold text-flow-out-text hover:brightness-95">Hapus</button>
      </div>
    </article>
  );
}

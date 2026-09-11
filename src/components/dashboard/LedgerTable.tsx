import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { rupiah } from "../../lib/finance";
import type { FinanceData, LedgerFilter } from "../../lib/types";
import { Badge } from "../ui/primitives";

const filters: { key: LedgerFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "income", label: "Dana masuk" },
  { key: "expense", label: "Dana keluar" },
  { key: "transfer", label: "Transfer" },
];

function kindOf(kind: string): "income" | "expense" | "transfer" {
  if (kind === "income") return "income";
  if (kind === "expense") return "expense";
  return "transfer";
}

export default function LedgerTable({ data, filter, setFilter, limit }: { data: FinanceData; filter: LedgerFilter; setFilter: (filter: LedgerFilter) => void; limit?: number }) {
  const rows = [...data.entries]
    .filter((entry) => filter === "all" || kindOf(entry.kind) === filter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const visible = limit ? rows.slice(0, limit) : rows;

  return (
    <section className="rounded-xl border border-line bg-surface shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <h2 className="mr-auto text-sm font-bold text-ink-900">Transaksi</h2>
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${filter === key ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-surface text-ink-500 hover:bg-slate-50"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-500">Belum ada transaksi pada filter ini.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((entry) => {
            const wallet = data.wallets.find((item) => item.id === entry.walletId);
            const kind = kindOf(entry.kind);
            const outgoing = entry.kind === "expense" || entry.kind === "transfer-out";
            return (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${kind === "income" ? "bg-flow-in-bg text-flow-in-text" : kind === "expense" ? "bg-flow-out-bg text-flow-out-text" : "bg-flow-move-bg text-flow-move-text"}`}>
                  {kind === "income" ? <ArrowDownLeft size={16} /> : kind === "expense" ? <ArrowUpRight size={16} /> : <ArrowLeftRight size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">{entry.note}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                    {entry.date} · {wallet?.name ?? "Dompet dihapus"}
                    <Badge tone={kind === "income" ? "in" : kind === "expense" ? "out" : "move"}>{kind === "income" ? "Masuk" : kind === "expense" ? "Keluar" : "Transfer"}</Badge>
                  </span>
                </span>
                <strong className={`tabular shrink-0 text-sm font-bold ${outgoing ? "text-flow-out-text" : "text-flow-in-text"}`}>
                  {outgoing ? "−" : "+"}{rupiah.format(entry.amount)}
                </strong>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

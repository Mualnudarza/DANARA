import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { groupByDay, rupiah } from "../../lib/finance";
import type { FinanceData } from "../../lib/types";
import { Badge } from "../ui/primitives";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function CalendarView({ data }: { data: FinanceData }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(now.toISOString().slice(0, 10));
  const days = useMemo(() => groupByDay(data.entries, year, month), [data.entries, year, month]);
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array<null>(firstWeekday).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  const label = new Date(year, month, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const selectedEntries = data.entries
    .filter((entry) => entry.date === selected)
    .sort((a, b) => a.id.localeCompare(b.id));

  function shift(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button onClick={() => shift(-1)} aria-label="Bulan sebelumnya" className="rounded-lg border border-line p-1.5 hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <h2 className="text-sm font-bold capitalize text-ink-900">{label}</h2>
          <button onClick={() => shift(1)} aria-label="Bulan berikutnya" className="rounded-lg border border-line p-1.5 hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-ink-500">
          {DAYS.map((day) => <span key={day} className="py-1">{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, index) => {
            if (!day) return <span key={`empty-${index}`} />;
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const agg = days[key];
            const isToday = key === now.toISOString().slice(0, 10);
            const isSelected = key === selected;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`min-h-16 rounded-lg border p-1.5 text-left transition-colors sm:min-h-20 ${isSelected ? "border-ink-900 bg-slate-50" : "border-line bg-surface hover:bg-slate-50"} ${isToday ? "ring-1 ring-ink-900" : ""}`}
              >
                <span className={`tabular text-xs font-bold ${isToday ? "text-ink-900" : "text-ink-500"}`}>{day}</span>
                {agg ? (
                  <span className="mt-1 hidden flex-col gap-0.5 sm:flex">
                    {agg.income > 0 && <strong className="tabular truncate text-[11px] text-flow-in-text">+{rupiah.format(agg.income)}</strong>}
                    {agg.expense > 0 && <strong className="tabular truncate text-[11px] text-flow-out-text">−{rupiah.format(agg.expense)}</strong>}
                    {agg.hasTransfer && <span className="text-[10px] font-semibold text-flow-move-text">⇄ transfer</span>}
                  </span>
                ) : (
                  <span className="mt-1 hidden text-[10px] text-slate-300 sm:block">—</span>
                )}
                {agg && <span className="mt-1 flex gap-1 sm:hidden">{agg.income > 0 && <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}{agg.expense > 0 && <i className="h-1.5 w-1.5 rounded-full bg-rose-500" />}{agg.hasTransfer && <i className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="h-fit rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-bold text-ink-900">Transaksi {selected}</h2>
        <p className="mt-0.5 text-xs text-ink-500">{selectedEntries.length ? `${selectedEntries.length} transaksi` : "Tidak ada transaksi."}</p>
        {selectedEntries.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100">
            {selectedEntries.map((entry) => {
              const wallet = data.wallets.find((item) => item.id === entry.walletId);
              const outgoing = entry.kind === "expense" || entry.kind === "transfer-out";
              const tone = entry.kind === "income" ? "in" : entry.kind === "expense" ? "out" : "move";
              return (
                <li key={entry.id} className="flex items-center gap-2 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">{entry.note}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">{wallet?.name ?? "Dompet dihapus"} <Badge tone={tone}>{tone === "in" ? "Masuk" : tone === "out" ? "Keluar" : "Transfer"}</Badge></span>
                  </span>
                  <strong className={`tabular shrink-0 text-sm ${outgoing ? "text-flow-out-text" : "text-flow-in-text"}`}>{outgoing ? "−" : "+"}{rupiah.format(entry.amount)}</strong>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

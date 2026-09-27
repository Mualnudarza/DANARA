export default function MetricCard({ label, value, hint, tone = "neutral", prominent = false }: { label: string; value: string; hint?: string; tone?: "neutral" | "in" | "out"; prominent?: boolean }) {
  const iconBg = tone === "in" ? "bg-flow-in-bg text-flow-in-text" : tone === "out" ? "bg-flow-out-bg text-flow-out-text" : "bg-slate-100 text-ink-500";
  return (
    <section className={`rounded-xl border border-line bg-surface shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] ${prominent ? "p-4 sm:p-5" : "p-3 sm:p-4"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 sm:text-[11px]">{label}</p>
        <span className={`grid h-6 w-6 place-items-center rounded-md ${iconBg} sm:h-7 sm:w-7`}>
          <span className="text-xs font-bold sm:text-sm">Rp</span>
        </span>
      </div>
      <p className={`tabular mt-1 font-extrabold tracking-tight text-ink-900 sm:mt-2 ${prominent ? "text-xl sm:text-3xl" : "text-base sm:text-xl"}`}>{value}</p>
      {hint && <p className="mt-0.5 truncate text-[10px] text-ink-500 sm:mt-1 sm:text-xs">{hint}</p>}
    </section>
  );
}

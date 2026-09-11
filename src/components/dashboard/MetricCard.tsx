export default function MetricCard({ label, value, hint, tone = "neutral" }: { label: string; value: string; hint?: string; tone?: "neutral" | "in" | "out" }) {
  const iconBg = tone === "in" ? "bg-flow-in-bg text-flow-in-text" : tone === "out" ? "bg-flow-out-bg text-flow-out-text" : "bg-slate-100 text-ink-500";
  return (
    <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{label}</p>
        <span className={`grid h-7 w-7 place-items-center rounded-md ${iconBg}`}>
          <span className="text-sm font-bold">Rp</span>
        </span>
      </div>
      <p className="tabular mt-2 text-2xl font-extrabold tracking-tight text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-ink-500">{label}</div>;
}

export function ModalShell({ title, subtitle, children, onClose }: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-[2px]" role="presentation" onClick={onClose}>
      <section className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-md px-2 py-1 text-lg leading-none text-ink-500 hover:bg-slate-100">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function Badge({ tone, children }: { tone: "in" | "out" | "move"; children: React.ReactNode }) {
  const styles = {
    in: "border-flow-in-line bg-flow-in-bg text-flow-in-text",
    out: "border-flow-out-line bg-flow-out-bg text-flow-out-text",
    move: "border-flow-move-line bg-flow-move-bg text-flow-move-text",
  } as const;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[tone]}`}>{children}</span>;
}

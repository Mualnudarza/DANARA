import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <aside
      aria-live="polite"
      role="status"
      className="fixed bottom-16 right-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-lg transition-all sm:bottom-6 sm:right-6"
    >
      <CheckCircle2 size={18} className="shrink-0 text-flow-in-text" aria-hidden />
      <p className="text-xs font-medium text-ink-900">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="ml-auto rounded-md p-1 text-ink-500 hover:bg-slate-100 hover:text-ink-900"
      >
        <X size={14} />
      </button>
    </aside>
  );
}

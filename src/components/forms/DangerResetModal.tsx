import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { ModalShell } from "../ui/primitives";

const REQUIRED_KEYWORD = "HAPUS SEMUA";

export default function DangerResetModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [keyword, setKeyword] = useState("");

  const isKeywordValid = keyword.trim().toUpperCase() === REQUIRED_KEYWORD;
  const canReset = agreed && isKeywordValid;

  return (
    <ModalShell
      title="Zona Bahaya: Reset Seluruh Data"
      subtitle="Tindakan ini menghapus seluruh data keuangan Anda."
      onClose={onClose}
    >
      <div className="grid gap-4">
        {/* Tier 1: Warning Details */}
        <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          <AlertTriangle size={20} className="shrink-0 text-rose-600" />
          <div className="grid gap-1">
            <p className="font-bold">Item yang akan direset ke pengaturan awal:</p>
            <ul className="list-inside list-disc space-y-0.5 text-rose-800">
              <li>Seluruh transaksi &amp; riwayat mutasi kas</li>
              <li>Semua dompet, saldo, dan target dompet</li>
              <li>Semua catatan hutang &amp; riwayat pembayaran</li>
              <li>Semua portofolio aset aktif maupun terjual</li>
              <li>Template alokasi dana dan pengaturan</li>
            </ul>
          </div>
        </div>

        {/* Tier 2: Checkbox Agreement */}
        <label className="flex items-start gap-2.5 rounded-lg border border-line bg-slate-50 p-3 text-xs text-ink-800 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-line text-rose-600 focus:ring-rose-500"
          />
          <span className="font-medium">
            Saya mengerti bahwa seluruh data akan dihapus secara permanen dan <strong>tidak dapat dipulihkan</strong> kembali.
          </span>
        </label>

        {/* Tier 3: Typing Confirmation */}
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-ink-700">
            Ketik kata <span className="font-mono font-bold text-rose-600">{REQUIRED_KEYWORD}</span> di bawah untuk konfirmasi:
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={`Ketik ${REQUIRED_KEYWORD}`}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 font-mono text-sm font-semibold tracking-wider text-ink-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-700 active:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!canReset}
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40 active:bg-rose-700"
          >
            <Trash2 size={16} /> Reset Sekarang
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

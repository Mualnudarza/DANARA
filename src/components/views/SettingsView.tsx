import { useState } from "react";
import { Cloud, LogIn, LogOut } from "lucide-react";
import { allocationTotal } from "../../lib/finance";
import type { FinanceData, IncomeType, Wallet } from "../../lib/types";
import type { UserLike } from "../layout/types";
import { Empty } from "../ui/primitives";

export default function SettingsView({
  data,
  user,
  addIncomeType,
  updateIncomeType,
  deleteIncomeType,
  signInGoogle,
  signOut,
}: {
  data: FinanceData;
  user?: UserLike;
  addIncomeType: (name: string) => void;
  updateIncomeType: (type: IncomeType) => void;
  deleteIncomeType: (id: string) => void;
  signInGoogle?: () => void;
  signOut?: () => void;
}) {
  const [newName, setNewName] = useState("");
  const isLocal = user?.isLocal ?? true;

  return (
    <div className="grid max-w-4xl gap-4 sm:gap-5">
      {/* Account & Storage Sync Section */}
      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <h2 className="text-sm font-bold text-ink-900">Penyimpanan &amp; Akun</h2>
        <p className="mt-0.5 text-xs text-ink-500">
          {isLocal
            ? "Danara berjalan dalam mode lokal. Data tersimpan di HP ini tanpa perlu login."
            : "Akun Google terhubung. Data dicadangkan otomatis ke cloud Supabase."}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-slate-50 p-3">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-8 w-8 place-items-center rounded-lg ${isLocal ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
              <Cloud size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-ink-900">{isLocal ? "Mode Lokal (Offline)" : "Cloud Supabase Aktif"}</p>
              <p className="text-[11px] text-ink-500">{user?.email || "Perangkat ini"}</p>
            </div>
          </div>

          {isLocal ? (
            signInGoogle && (
              <button
                onClick={signInGoogle}
                className="flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white active:bg-ink-700"
              >
                <LogIn size={14} /> Hubungkan Akun Google
              </button>
            )
          ) : (
            signOut && (
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-700 active:bg-slate-100"
              >
                <LogOut size={14} /> Putuskan / Pakai Lokal
              </button>
            )
          )}
        </div>
      </section>

      {/* Income Types Configuration */}
      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <h2 className="text-sm font-bold text-ink-900">Tambah tipe pemasukan</h2>
        <p className="mb-3 mt-0.5 text-xs text-ink-500">Setelah ditambahkan, atur persentase tiap dompet hingga total 100%.</p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            addIncomeType(newName);
            setNewName("");
          }}
        >
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Contoh: Gaji Bulanan"
            className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink-900"
          />
          <button className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white active:bg-ink-700" type="submit">
            Tambah tipe
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <h2 className="text-sm font-bold text-ink-900">Pengaturan alokasi</h2>
        <p className="text-xs text-ink-500">Perubahan hanya dipakai pemasukan baru. Riwayat lama tidak berubah.</p>
        {data.incomeTypes.length === 0 && <div className="mt-3"><Empty label="Belum ada tipe pemasukan." /></div>}
        {data.incomeTypes.map((incomeType) => (
          <AllocationEditor key={incomeType.id} type={incomeType} wallets={data.wallets} onSave={updateIncomeType} onDelete={deleteIncomeType} />
        ))}
      </section>
    </div>
  );
}

function AllocationEditor({ type, wallets, onSave, onDelete }: { type: IncomeType; wallets: Wallet[]; onSave: (type: IncomeType) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState(type.name);
  const [allocation, setAllocation] = useState<Record<string, number>>(type.allocations);
  const total = allocationTotal({ ...type, name, allocations: allocation });
  const valid = total === 100;
  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <input value={name} onChange={(event) => setName(event.target.value)} aria-label="Nama tipe" className="max-w-70 border-0 bg-transparent p-0 text-sm font-bold text-ink-900 focus:outline-none" />
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${valid ? "bg-flow-in-bg text-flow-in-text" : "bg-flow-out-bg text-flow-out-text"}`}>{total}%</span>
      </div>
      {!valid && <p role="alert" className="mb-3 rounded-lg border border-flow-out-line bg-flow-out-bg px-3 py-2 text-xs font-semibold text-flow-out-text">Total harus tepat 100% sebelum disimpan.</p>}
      {wallets.length === 0 ? (
        <Empty label="Tambahkan dompet dulu agar alokasi bisa diatur." />
      ) : (
        <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => (
            <label key={wallet.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 font-medium text-ink-700">
                <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: wallet.color }} />
                <span className="truncate">{wallet.name}</span>
              </span>
              <span className="relative w-14 shrink-0">
                <input type="number" min={0} max={100} value={allocation[wallet.id] ?? 0} onChange={(event) => setAllocation({ ...allocation, [wallet.id]: Number(event.target.value) || 0 })} className="tabular h-7 w-full rounded-md border border-line pr-5 text-right text-xs" />
                <b className="absolute right-1.5 top-1 text-[10px] text-ink-500">%</b>
              </span>
            </label>
          ))}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={() => onDelete(type.id)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">Hapus</button>
        <button type="button" disabled={!valid} onClick={() => onSave({ ...type, name, allocations: allocation })} className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Simpan alokasi</button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { allocationTotal } from "../../lib/finance";
import type { FinanceData, IncomeType, Wallet } from "../../lib/types";
import { Empty } from "../ui/primitives";

export default function SettingsView({ data, addIncomeType, updateIncomeType, deleteIncomeType }: {
  data: FinanceData;
  addIncomeType: (name: string) => void;
  updateIncomeType: (type: IncomeType) => void;
  deleteIncomeType: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  return (
    <div className="grid max-w-4xl gap-5">
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
          <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Contoh: Gaji Bulanan" className="h-10 flex-1 rounded-lg border border-line px-3 text-sm" />
          <button className="rounded-lg bg-ink-900 px-3 py-2.5 text-sm font-semibold text-white" type="submit">Tambah tipe</button>
        </form>
      </section>
      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <h2 className="text-sm font-bold text-ink-900">Pengaturan alokasi</h2>
        <p className="text-xs text-ink-500">Perubahan hanya dipakai pemasukan baru. Riwayat tidak berubah.</p>
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
        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${valid ? "bg-flow-in-bg text-flow-in-text" : "bg-flow-out-bg text-flow-out-text"}`}>{total}%</span>
      </div>
      {!valid && <p role="alert" className="mb-3 rounded-lg border border-flow-out-line bg-flow-out-bg px-3 py-2 text-xs font-semibold text-flow-out-text">Total harus tepat 100% sebelum disimpan.</p>}
      {wallets.length === 0 ? (
        <Empty label="Tambahkan dompet dulu agar alokasi bisa diatur." />
      ) : (
        <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => (
            <label key={wallet.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-2.5 py-2 text-xs">
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
      <div className="flex gap-2">
        <button type="button" disabled={!valid || !name.trim()} onClick={() => onSave({ ...type, name, allocations: allocation })} title={valid ? "Simpan alokasi" : "Total harus tepat 100%"} className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Simpan alokasi</button>
        <button type="button" onClick={() => onDelete(type.id)} className="rounded-lg border border-flow-out-line bg-flow-out-bg px-3 py-1.5 text-xs font-semibold text-flow-out-text">Hapus tipe</button>
      </div>
    </div>
  );
}

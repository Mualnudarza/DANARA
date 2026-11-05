import { useState } from "react";
import { rupiah, splitIncome, isValidAllocation } from "../../lib/finance";
import type { FinanceData } from "../../lib/types";
import { Field, ModalShell } from "../ui/primitives";

const today = new Date().toISOString().slice(0, 10);
const inputCls = "h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm";

function inputNumber(value: string) {
  return Number(value.replace(/\D/g, "")) || 0;
}

const PRESET_AMOUNTS = [
  { label: "+10rb", value: 10_000 },
  { label: "+20rb", value: 20_000 },
  { label: "+50rb", value: 50_000 },
  { label: "+100rb", value: 100_000 },
  { label: "+500rb", value: 500_000 },
];

function QuickAmountChips({ onAdd, onClear }: { onAdd: (val: number) => void; onClear: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {PRESET_AMOUNTS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => onAdd(preset.value)}
          className="rounded-md border border-line bg-slate-50 px-2.5 py-1 text-xs font-semibold text-ink-700 transition-colors hover:bg-slate-100 active:scale-95"
        >
          {preset.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 active:scale-95"
      >
        Reset
      </button>
    </div>
  );
}

export function IncomeModal({ data, onClose, onSubmit }: { data: FinanceData; onClose: () => void; onSubmit: (form: FormData) => void }) {
  const [typeId, setTypeId] = useState(data.incomeTypes[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const type = data.incomeTypes.find((item) => item.id === typeId);
  const max = Math.max(...(type ? Object.values(type.allocations) : [0]), 1);

  return (
    <ModalShell title="Catat dana masuk" subtitle="Nominal dibagi otomatis ke dompet sesuai alokasi." onClose={onClose}>
      <form action={(form) => onSubmit(form)} className="grid gap-3.5">
        <Field label="Tipe pemasukan">
          <select name="incomeType" value={typeId} onChange={(event) => setTypeId(event.target.value)} required className={inputCls}>
            {data.incomeTypes.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Nominal">
          <input
            name="amount"
            inputMode="numeric"
            placeholder="0"
            value={amount > 0 ? amount : ""}
            onChange={(event) => setAmount(inputNumber(event.target.value))}
            required
            className={`${inputCls} tabular text-center text-xl font-bold tracking-tight`}
          />
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Terbilang:</span>
            <strong className="tabular font-semibold text-ink-900">
              {amount > 0 ? rupiah.format(amount) : "Rp 0"}
            </strong>
          </div>
          <QuickAmountChips
            onAdd={(val) => setAmount((prev) => prev + val)}
            onClear={() => setAmount(0)}
          />
        </Field>

        <Field label="Tanggal">
          <input name="date" type="date" defaultValue={today} required className={inputCls} />
        </Field>

        <Field label="Catatan">
          <input name="note" placeholder="Contoh: Gaji September" className={inputCls} />
        </Field>

        {type && amount > 0 && (
          <div className="grid gap-2 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Preview alokasi</p>
            {splitIncome(amount, type).map(({ walletId, amount: split }) => {
              const wallet = data.wallets.find((item) => item.id === walletId);
              const pct = type.allocations[walletId] ?? 0;
              return (
                <div key={walletId}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-700">{wallet?.name} · {pct}%</span>
                    <strong className="tabular text-ink-900">{rupiah.format(split)}</strong>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full" style={{ width: `${(pct / max) * 100}%`, background: wallet?.color ?? "#0f172a" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex items-center justify-end gap-2 border-t border-line bg-surface/98 p-4 pb-safe backdrop-blur sm:-mx-6 sm:-mb-6 sm:static sm:bg-transparent sm:p-0 sm:pt-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-slate-50">
            Batal
          </button>
          <button disabled={!type || !isValidAllocation(type) || amount <= 0} className="rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 active:scale-95">
            Simpan
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function ExpenseModal({ data, balances, onClose, onSubmit }: { data: FinanceData; balances: Record<string, number>; onClose: () => void; onSubmit: (form: FormData) => void }) {
  const [walletId, setWalletId] = useState(data.wallets[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const available = balances[walletId] ?? 0;
  const over = amount > available;

  return (
    <ModalShell title="Catat dana keluar" subtitle="Kurangi saldo satu dompet." onClose={onClose}>
      <form action={(form) => onSubmit(form)} className="grid gap-3.5">
        <Field label="Dompet">
          <select name="walletId" value={walletId} onChange={(event) => setWalletId(event.target.value)} required className={inputCls}>
            {data.wallets.map((wallet) => (
              <option value={wallet.id} key={wallet.id}>{wallet.name} · {rupiah.format(balances[wallet.id] ?? 0)}</option>
            ))}
          </select>
        </Field>

        <Field label="Nominal">
          <input
            name="amount"
            inputMode="numeric"
            placeholder="0"
            value={amount > 0 ? amount : ""}
            onChange={(event) => setAmount(inputNumber(event.target.value))}
            required
            className={`${inputCls} tabular text-center text-xl font-bold tracking-tight`}
          />
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Tersedia: <strong className="tabular text-ink-900">{rupiah.format(available)}</strong></span>
            <strong className="tabular font-semibold text-ink-900">
              {amount > 0 ? rupiah.format(amount) : "Rp 0"}
            </strong>
          </div>
          <QuickAmountChips
            onAdd={(val) => setAmount((prev) => prev + val)}
            onClear={() => setAmount(0)}
          />
        </Field>

        {over && amount > 0 && (
          <p role="alert" className="rounded-lg border border-flow-out-line bg-flow-out-bg px-3 py-2 text-xs font-semibold text-flow-out-text">
            Nominal melebihi saldo dompet. Kurangi nominal atau pindahkan saldo dulu.
          </p>
        )}

        <Field label="Tanggal">
          <input name="date" type="date" defaultValue={today} required className={inputCls} />
        </Field>

        <Field label="Catatan">
          <input name="note" placeholder="Contoh: Belanja grocery" className={inputCls} />
        </Field>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex items-center justify-end gap-2 border-t border-line bg-surface/98 p-4 pb-safe backdrop-blur sm:-mx-6 sm:-mb-6 sm:static sm:bg-transparent sm:p-0 sm:pt-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-slate-50">
            Batal
          </button>
          <button disabled={over || amount <= 0} className="rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 active:scale-95">
            Simpan
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function TransferModal({ data, balances, onClose, onSubmit }: { data: FinanceData; balances: Record<string, number>; onClose: () => void; onSubmit: (form: FormData) => void }) {
  const [from, setFrom] = useState(data.wallets[0]?.id ?? "");
  const [to, setTo] = useState(data.wallets[1]?.id ?? data.wallets[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const available = balances[from] ?? 0;
  const same = from === to;
  const over = amount > available;

  return (
    <ModalShell title="Pindah saldo" subtitle="Total saldo tidak berubah, hanya berpindah dompet." onClose={onClose}>
      <form action={(form) => onSubmit(form)} className="grid gap-3.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="Dari dompet">
            <select name="from" value={from} onChange={(event) => setFrom(event.target.value)} required className={inputCls}>
              {data.wallets.map((wallet) => (
                <option value={wallet.id} key={wallet.id}>{wallet.name}</option>
              ))}
            </select>
          </Field>
          <span aria-hidden className="pb-3 text-lg text-ink-500">→</span>
          <Field label="Ke dompet">
            <select name="to" value={to} onChange={(event) => setTo(event.target.value)} required className={inputCls}>
              {data.wallets.map((wallet) => (
                <option value={wallet.id} key={wallet.id}>{wallet.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>Tersedia di sumber: <strong className="tabular text-ink-900">{rupiah.format(available)}</strong></span>
          <span>Tersedia di tujuan: <strong className="tabular text-ink-900">{rupiah.format(balances[to] ?? 0)}</strong></span>
        </div>

        {same && <p role="alert" className="rounded-lg border border-flow-move-line bg-flow-move-bg px-3 py-2 text-xs font-semibold text-flow-move-text">Pilih dua dompet yang berbeda.</p>}
        {over && amount > 0 && <p role="alert" className="rounded-lg border border-flow-out-line bg-flow-out-bg px-3 py-2 text-xs font-semibold text-flow-out-text">Nominal melebihi saldo dompet sumber.</p>}

        <Field label="Nominal">
          <input
            name="amount"
            inputMode="numeric"
            placeholder="0"
            value={amount > 0 ? amount : ""}
            onChange={(event) => setAmount(inputNumber(event.target.value))}
            required
            className={`${inputCls} tabular text-center text-xl font-bold tracking-tight`}
          />
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Terbilang:</span>
            <strong className="tabular font-semibold text-ink-900">
              {amount > 0 ? rupiah.format(amount) : "Rp 0"}
            </strong>
          </div>
          <QuickAmountChips
            onAdd={(val) => setAmount((prev) => prev + val)}
            onClear={() => setAmount(0)}
          />
        </Field>

        <Field label="Tanggal">
          <input name="date" type="date" defaultValue={today} required className={inputCls} />
        </Field>

        <Field label="Catatan">
          <input name="note" placeholder="Contoh: Top up belanja" className={inputCls} />
        </Field>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex items-center justify-end gap-2 border-t border-line bg-surface/98 p-4 pb-safe backdrop-blur sm:-mx-6 sm:-mb-6 sm:static sm:bg-transparent sm:p-0 sm:pt-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-slate-50">
            Batal
          </button>
          <button disabled={same || over || amount <= 0} className="rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 active:scale-95">
            Pindahkan
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

import { useState } from "react";
import { rupiah, splitIncome, isValidAllocation } from "../../lib/finance";
import type { FinanceData } from "../../lib/types";
import { Field, ModalShell } from "../ui/primitives";

const today = new Date().toISOString().slice(0, 10);
const inputCls = "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm";

function inputNumber(value: string) {
  return Number(value.replace(/\D/g, "")) || 0;
}

function WalletSelect({ data, balances, name, label = "Dompet" }: { data: FinanceData; balances: Record<string, number>; name: string; label?: string }) {
  return (
    <Field label={label}>
      <select name={name} required className={inputCls}>
        {data.wallets.map((wallet) => (
          <option value={wallet.id} key={wallet.id}>
            {wallet.name} · {rupiah.format(balances[wallet.id] ?? 0)}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function IncomeModal({ data, onClose, onSubmit }: { data: FinanceData; onClose: () => void; onSubmit: (form: FormData) => void }) {
  const [typeId, setTypeId] = useState(data.incomeTypes[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const type = data.incomeTypes.find((item) => item.id === typeId);
  const max = Math.max(...(type ? Object.values(type.allocations) : [0]), 1);
  return (
    <ModalShell title="Catat dana masuk" subtitle="Nominal dibagi otomatis ke dompet sesuai alokasi." onClose={onClose}>
      <form action={(form) => onSubmit(form)} className="grid gap-3">
        <Field label="Tipe pemasukan">
          <select name="incomeType" value={typeId} onChange={(event) => setTypeId(event.target.value)} required className={inputCls}>
            {data.incomeTypes.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Nominal">
          <input name="amount" inputMode="numeric" placeholder="10000000" onChange={(event) => setAmount(inputNumber(event.target.value))} required className={`${inputCls} tabular text-center text-lg font-bold`} />
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
        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-700">Batal</button>
          <button disabled={!type || !isValidAllocation(type)} className="rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Simpan</button>
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
      <form action={(form) => onSubmit(form)} className="grid gap-3">
        <Field label="Dompet">
          <select name="walletId" value={walletId} onChange={(event) => setWalletId(event.target.value)} required className={inputCls}>
            {data.wallets.map((wallet) => (
              <option value={wallet.id} key={wallet.id}>{wallet.name} · {rupiah.format(balances[wallet.id] ?? 0)}</option>
            ))}
          </select>
        </Field>
        <Field label="Nominal">
          <input name="amount" inputMode="numeric" placeholder="800000" onChange={(event) => setAmount(inputNumber(event.target.value))} required className={`${inputCls} tabular text-center text-lg font-bold`} />
        </Field>
        <p className="text-xs text-ink-500">Tersedia: <strong className="tabular text-ink-900">{rupiah.format(available)}</strong></p>
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
        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-700">Batal</button>
          <button disabled={over || amount <= 0} className="rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Simpan</button>
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
      <form action={(form) => onSubmit(form)} className="grid gap-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="Dari dompet">
            <select name="from" value={from} onChange={(event) => setFrom(event.target.value)} required className={inputCls}>
              {data.wallets.map((wallet) => (
                <option value={wallet.id} key={wallet.id}>{wallet.name}</option>
              ))}
            </select>
          </Field>
          <span aria-hidden className="pb-2.5 text-lg text-ink-500">→</span>
          <Field label="Ke dompet">
            <select name="to" value={to} onChange={(event) => setTo(event.target.value)} required className={inputCls}>
              {data.wallets.map((wallet) => (
                <option value={wallet.id} key={wallet.id}>{wallet.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-xs text-ink-500">Tersedia di sumber: <strong className="tabular text-ink-900">{rupiah.format(available)}</strong></p>
        {same && <p role="alert" className="rounded-lg border border-flow-move-line bg-flow-move-bg px-3 py-2 text-xs font-semibold text-flow-move-text">Pilih dua dompet yang berbeda.</p>}
        {over && amount > 0 && <p role="alert" className="rounded-lg border border-flow-out-line bg-flow-out-bg px-3 py-2 text-xs font-semibold text-flow-out-text">Nominal melebihi saldo dompet sumber.</p>}
        <p className="text-xs text-ink-500">Tersedia di tujuan: <strong className="tabular text-ink-900">{rupiah.format(balances[to] ?? 0)}</strong></p>
        <Field label="Nominal">
          <input name="amount" inputMode="numeric" placeholder="500000" onChange={(event) => setAmount(inputNumber(event.target.value))} required className={`${inputCls} tabular text-center text-lg font-bold`} />
        </Field>
        <Field label="Tanggal">
          <input name="date" type="date" defaultValue={today} required className={inputCls} />
        </Field>
        <Field label="Catatan">
          <input name="note" placeholder="Contoh: Top up belanja" className={inputCls} />
        </Field>
        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-700">Batal</button>
          <button disabled={same || over || amount <= 0} className="rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Pindahkan</button>
        </div>
      </form>
    </ModalShell>
  );
}

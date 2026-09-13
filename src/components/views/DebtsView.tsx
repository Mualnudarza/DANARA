import { useState } from "react";
import { debtRemaining, debtTotals, rupiah } from "../../lib/finance";
import type { Debt, FinanceData } from "../../lib/types";
import { Empty } from "../ui/primitives";

const today = new Date().toISOString().slice(0, 10);
const inputCls = "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm";

export default function DebtsView({
  data,
  balances,
  addDebt,
  topUpDebt,
  payDebt,
  settleDebt,
  deleteDebt,
}: {
  data: FinanceData;
  balances: Record<string, number>;
  addDebt: (form: FormData) => void;
  topUpDebt: (form: FormData) => void;
  payDebt: (form: FormData) => void;
  settleDebt: (id: string) => void;
  deleteDebt: (id: string) => void;
}) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [topUpId, setTopUpId] = useState<string | null>(null);
  const totals = debtTotals(data.debts, data.debtPayments);
  const active = data.debts.filter((debt) => debt.status === "active");
  const paid = data.debts.filter((debt) => debt.status === "paid");

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Hutangku" value={rupiah.format(totals.owe)} hint="Sisa yang harus kubayar" tone="out" />
        <SummaryCard label="Piutangku" value={rupiah.format(totals.owed)} hint="Sisa yang harus kembali" tone="in" />
        <SummaryCard label="Bersih" value={rupiah.format(totals.net)} hint="Piutang dikurangi hutang" tone="neutral" />
      </div>

      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <h2 className="text-sm font-bold text-ink-900">Hutang aktif</h2>
        <p className="mt-0.5 text-xs text-ink-500">Bayar atau tambah hutang lewat dompet supaya tercatat di ledger.</p>
        {active.length === 0 ? (
          <div className="mt-3"><Empty label="Tidak ada hutang aktif." /></div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((debt) => {
              const remaining = debtRemaining(debt, data.debtPayments);
              const pct = debt.initialAmount > 0 ? Math.round(((debt.initialAmount - remaining) / debt.initialAmount) * 100) : 0;
              return (
                <article key={debt.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-ink-900">{debt.name}</h3>
                      <p className="text-xs text-ink-500">{debt.direction === "owe" ? "Aku berhutang" : "Aku menghutangkan"}{debt.note ? ` · ${debt.note}` : ""}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${debt.direction === "owe" ? "border-flow-out-line bg-flow-out-bg text-flow-out-text" : "border-flow-in-line bg-flow-in-bg text-flow-in-text"}`}>
                      {debt.direction === "owe" ? "Hutang" : "Piutang"}
                    </span>
                  </div>
                  <p className="tabular mt-3 text-xl font-extrabold tracking-tight text-ink-900">{rupiah.format(remaining)}</p>
                  <p className="tabular text-xs text-ink-500">dari total {rupiah.format(debt.initialAmount)} · {pct}% lunas</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-ink-900" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setPayingId(payingId === debt.id ? null : debt.id); setTopUpId(null); }}
                      className="rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-semibold text-white"
                    >
                      {payingId === debt.id ? "Tutup" : debt.direction === "owe" ? "Bayar" : "Terima"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTopUpId(topUpId === debt.id ? null : debt.id); setPayingId(null); }}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-slate-50"
                    >
                      {topUpId === debt.id ? "Tutup" : "+ Tambah hutang"}
                    </button>
                    <button type="button" onClick={() => settleDebt(debt.id)} className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-700">Lunasi</button>
                    <button type="button" onClick={() => deleteDebt(debt.id)} className="rounded-lg border border-flow-out-line bg-flow-out-bg px-2.5 py-1.5 text-xs font-semibold text-flow-out-text">Hapus</button>
                  </div>

                  {payingId === debt.id && <PayForm debt={debt} data={data} balances={balances} onSubmit={(f) => { payDebt(f); setPayingId(null); }} />}
                  {topUpId === debt.id && <TopUpForm debt={debt} data={data} balances={balances} onSubmit={(f) => { topUpDebt(f); setTopUpId(null); }} />}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {paid.length > 0 && (
        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="text-sm font-bold text-ink-900">Sudah lunas ({paid.length})</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {paid.map((debt) => (
              <li key={debt.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate font-medium text-ink-700">{debt.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <strong className="tabular text-ink-900">{rupiah.format(debt.initialAmount)}</strong>
                  <button type="button" onClick={() => deleteDebt(debt.id)} className="text-xs font-semibold text-flow-out-text">Hapus</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="max-w-md rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-bold text-ink-900">Catat hutang baru</h2>
        <p className="mb-3 mt-0.5 text-xs text-ink-500">Jika menghutangkan, kamu bisa memotong saldo dompet atau memilih luar dompet.</p>
        <NewDebtForm data={data} balances={balances} onSubmit={addDebt} />
      </section>
    </div>
  );
}

function SummaryCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "in" | "out" | "neutral" }) {
  const badge = tone === "in" ? "bg-flow-in-bg text-flow-in-text" : tone === "out" ? "bg-flow-out-bg text-flow-out-text" : "bg-slate-100 text-ink-500";
  return (
    <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{label}</p>
        <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${badge}`}>Rp</span>
      </div>
      <p className="tabular mt-2 text-2xl font-extrabold tracking-tight text-ink-900">{value}</p>
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    </section>
  );
}

function NewDebtForm({ data, balances, onSubmit }: { data: FinanceData; balances: Record<string, number>; onSubmit: (form: FormData) => void }) {
  const [direction, setDirection] = useState<Debt["direction"]>("owe");
  const [walletId, setWalletId] = useState<string>("outside");

  return (
    <form action={(form) => onSubmit(form)} className="grid gap-3">
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Nama orang</span>
        <input name="name" required placeholder="Contoh: Budi" className={inputCls} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Jenis</span>
        <select name="direction" value={direction} onChange={(e) => setDirection(e.target.value as Debt["direction"])} className={inputCls}>
          <option value="owe">Aku berhutang (pinjam dari orang)</option>
          <option value="owed">Aku menghutangkan (kasih pinjam)</option>
        </select>
      </label>

      {direction === "owed" && (
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink-700">Sumber dana pinjaman</span>
          <select name="sourceWalletId" value={walletId} onChange={(e) => setWalletId(e.target.value)} className={inputCls}>
            <option value="outside">Di luar dompet (uang kerabat / tunai lain)</option>
            {data.wallets.map((wallet) => (
              <option value={wallet.id} key={wallet.id}>
                {wallet.name} (tersedia {rupiah.format(balances[wallet.id] ?? 0)})
              </option>
            ))}
          </select>
          {walletId !== "outside" && (
            <span className="text-[11px] text-ink-500">Saldo dompet ini akan terpotong sebagai pengeluaran pinjaman.</span>
          )}
        </label>
      )}

      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Nominal</span>
        <input name="amount" inputMode="numeric" required placeholder="1000000" className={`${inputCls} tabular`} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Tanggal</span>
        <input name="date" type="date" defaultValue={today} required className={inputCls} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Catatan</span>
        <input name="note" placeholder="Contoh: Pinjam darurat" className={inputCls} />
      </label>
      <button className="rounded-lg bg-ink-900 px-3 py-2.5 text-sm font-semibold text-white" type="submit">Simpan hutang</button>
    </form>
  );
}

function PayForm({ debt, data, balances, onSubmit }: { debt: Debt; data: FinanceData; balances: Record<string, number>; onSubmit: (form: FormData) => void }) {
  const remaining = debtRemaining(debt, data.debtPayments);
  const [walletId, setWalletId] = useState(data.wallets[0]?.id ?? "outside");

  return (
    <form action={(form) => onSubmit(form)} className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3">
      <input type="hidden" name="debtId" value={debt.id} />
      <p className="text-xs text-ink-500">Sisa: <strong className="tabular text-ink-900">{rupiah.format(remaining)}</strong></p>
      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">
          {debt.direction === "owe" ? "Bayar dari dompet" : "Terima ke dompet"}
        </span>
        <select name="walletId" value={walletId} onChange={(e) => setWalletId(e.target.value)} required className={inputCls}>
          {data.wallets.map((wallet) => (
            <option value={wallet.id} key={wallet.id}>
              {wallet.name} ({debt.direction === "owe" ? `saldo ${rupiah.format(balances[wallet.id] ?? 0)}` : ""})
            </option>
          ))}
          <option value="outside">Di luar dompet (tidak catat ledger)</option>
        </select>
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">Nominal</span>
        <input name="amount" inputMode="numeric" required placeholder={String(remaining)} className={`${inputCls} tabular`} />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">Tanggal</span>
        <input name="date" type="date" defaultValue={today} required className={inputCls} />
      </label>
      <button className="rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white" type="submit">Simpan pembayaran</button>
    </form>
  );
}

function TopUpForm({ debt, data, balances, onSubmit }: { debt: Debt; data: FinanceData; balances: Record<string, number>; onSubmit: (form: FormData) => void }) {
  const [walletId, setWalletId] = useState("outside");

  return (
    <form action={(form) => onSubmit(form)} className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3">
      <input type="hidden" name="debtId" value={debt.id} />
      <p className="text-xs font-semibold text-ink-900">Tambah nominal hutang ({debt.name})</p>
      <p className="text-[11px] text-ink-500">Nominal akan diakumulasikan ke total hutang yang ada.</p>

      {debt.direction === "owed" && (
        <label className="grid gap-1">
          <span className="text-[11px] font-semibold text-ink-700">Sumber dana pinjaman tambahan</span>
          <select name="walletId" value={walletId} onChange={(e) => setWalletId(e.target.value)} className={inputCls}>
            <option value="outside">Di luar dompet</option>
            {data.wallets.map((wallet) => (
              <option value={wallet.id} key={wallet.id}>
                {wallet.name} (saldo {rupiah.format(balances[wallet.id] ?? 0)})
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">Nominal tambahan</span>
        <input name="amount" inputMode="numeric" required placeholder="Contoh: 15000000" className={`${inputCls} tabular`} />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">Tanggal</span>
        <input name="date" type="date" defaultValue={today} required className={inputCls} />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">Catatan tambahan</span>
        <input name="note" placeholder="Contoh: Tambah pinjam untuk dekorasi" className={inputCls} />
      </label>
      <button className="rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white" type="submit">Tambah ke hutang</button>
    </form>
  );
}

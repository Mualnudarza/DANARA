import { useState } from "react";
import type { Wallet } from "../../lib/types";
import { Field } from "../ui/primitives";

export function WalletCreateForm({ onSubmit }: { onSubmit: (form: FormData) => void }) {
  return (
    <form action={(form) => onSubmit(form)} className="grid gap-3">
      <Field label="Nama dompet">
        <input name="name" placeholder="Contoh: Dana darurat" required className="h-10 rounded-lg border border-line bg-surface px-3 text-sm" />
      </Field>
      <Field label="Rekening atau e-wallet">
        <input name="account" placeholder="Contoh: BCA" className="h-10 rounded-lg border border-line bg-surface px-3 text-sm" />
      </Field>
      <Field label="Warna">
        <input name="color" type="color" defaultValue="#2563eb" className="h-10 w-20 rounded-lg border border-line p-1" />
      </Field>
      <button className="rounded-lg bg-ink-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-ink-700" type="submit">Tambah dompet</button>
    </form>
  );
}

export function WalletEditForm({ wallet, onSave, onCancel }: { wallet: Wallet; onSave: (wallet: Wallet) => void; onCancel: () => void }) {
  const [name, setName] = useState(wallet.name);
  const [account, setAccount] = useState(wallet.account);
  const [color, setColor] = useState(wallet.color);
  return (
    <form
      className="grid gap-3 rounded-xl border border-line bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...wallet, name, account, color });
      }}
    >
      <Field label="Nama dompet">
        <input value={name} onChange={(event) => setName(event.target.value)} required className="h-10 rounded-lg border border-line px-3 text-sm" />
      </Field>
      <Field label="Rekening atau e-wallet">
        <input value={account} onChange={(event) => setAccount(event.target.value)} className="h-10 rounded-lg border border-line px-3 text-sm" />
      </Field>
      <Field label="Warna">
        <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-10 w-20 rounded-lg border border-line p-1" />
      </Field>
      <div className="flex gap-2">
        <button className="rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white" type="submit">Simpan</button>
        <button className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-700" type="button" onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}

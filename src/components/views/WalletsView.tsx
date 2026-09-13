import { useState } from "react";
import { rupiah, walletTargetLookup } from "../../lib/finance";
import type { FinanceData, Wallet } from "../../lib/types";
import { Empty } from "../ui/primitives";
import WalletCard from "../dashboard/WalletCard";
import { WalletCreateForm, WalletEditForm } from "../forms/WalletForms";

export default function WalletsView({
  data,
  balances,
  addWallet,
  updateWallet,
  deleteWallet,
  setWalletTarget,
}: {
  data: FinanceData;
  balances: Record<string, number>;
  addWallet: (form: FormData) => void;
  updateWallet: (wallet: Wallet) => void;
  deleteWallet: (id: string) => void;
  setWalletTarget: (walletId: string, target: number) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const targets = walletTargetLookup(data.walletTargets);

  return (
    <div className="grid gap-5">
      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <h2 className="text-sm font-bold text-ink-900">Dompet</h2>
        <p className="mt-0.5 text-xs text-ink-500">Kelola dompet, label rekening, dan target saldo per dompet.</p>
        {data.wallets.length === 0 ? (
          <div className="mt-3"><Empty label="Belum ada dompet. Tambahkan dompet pertama di bawah." /></div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.wallets.map((wallet) =>
              editingId === wallet.id ? (
                <WalletEditForm key={wallet.id} wallet={wallet} onCancel={() => setEditingId(null)} onSave={(next) => { updateWallet(next); setEditingId(null); }} />
              ) : (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  balance={balances[wallet.id] ?? 0}
                  target={targets[wallet.id]}
                  onEdit={() => setEditingId(wallet.id)}
                  onDelete={() => deleteWallet(wallet.id)}
                  onSaveTarget={(t) => setWalletTarget(wallet.id, t)}
                />
              ),
            )}
          </div>
        )}
      </section>
      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <h2 className="text-sm font-bold text-ink-900">Tambah dompet</h2>
        <p className="mb-3 mt-0.5 text-xs text-ink-500">Dompet baru langsung bisa dipakai di semua form.</p>
        <div className="max-w-md"><WalletCreateForm onSubmit={addWallet} /></div>
      </section>
      <p className="tabular text-xs text-ink-500">Total seluruh dompet: <strong className="text-ink-900">{rupiah.format(Object.values(balances).reduce((sum, value) => sum + value, 0))}</strong></p>
    </div>
  );
}

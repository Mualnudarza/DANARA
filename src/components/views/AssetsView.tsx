import { useState } from "react";
import { activeAssetsTotal, assetPL, rupiah } from "../../lib/finance";
import type { Asset, AssetCategory, FinanceData } from "../../lib/types";
import { Empty } from "../ui/primitives";

const today = new Date().toISOString().slice(0, 10);
const inputCls = "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm";

const categoryLabels: Record<AssetCategory, string> = {
  saham: "Saham & Reksa Dana",
  emas: "Emas & Logam Mulia",
  properti: "Properti & Tanah",
  ternak: "Ternak & Hewan",
  barang: "Barang & Koleksi",
  lainnya: "Lainnya",
};

export default function AssetsView({
  data,
  balances,
  addAsset,
  updateAssetPrice,
  sellAsset,
  deleteAsset,
}: {
  data: FinanceData;
  balances: Record<string, number>;
  addAsset: (form: FormData) => void;
  updateAssetPrice: (id: string, newPrice: number) => void;
  sellAsset: (form: FormData) => void;
  deleteAsset: (id: string) => void;
}) {
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  const active = data.assets.filter((a) => a.status === "active");
  const sold = data.assets.filter((a) => a.status === "sold");

  const totalBuyActive = active.reduce((sum, a) => sum + a.buyPrice, 0);
  const totalCurrentActive = activeAssetsTotal(data.assets);
  const totalPL = totalCurrentActive - totalBuyActive;
  const totalPLPct = totalBuyActive > 0 ? Math.round((totalPL / totalBuyActive) * 100) : 0;

  return (
    <div className="grid gap-5">
      {/* Summary KPI */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total nilai aset" value={rupiah.format(totalCurrentActive)} hint={`${active.length} aset aktif`} tone="in" />
        <SummaryCard label="Modal beli" value={rupiah.format(totalBuyActive)} hint="Total harga beli aset aktif" tone="neutral" />
        <SummaryCard
          label="Keuntungan / Kerugian"
          value={`${totalPL >= 0 ? "+" : ""}${rupiah.format(totalPL)} (${totalPLPct}%)`}
          hint="Perubahan nilai aset aktif saat ini"
          tone={totalPL >= 0 ? "in" : "out"}
        />
      </div>

      {/* Active Assets */}
      <section className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
        <h2 className="text-sm font-bold text-ink-900">Portofolio aset aktif</h2>
        <p className="mt-0.5 text-xs text-ink-500">Nilai kini dapat diperbarui berkala untuk melacak keuntungan/kerugian.</p>
        {active.length === 0 ? (
          <div className="mt-3"><Empty label="Belum ada aset yang dicatat. Tambahkan aset pertama di bawah." /></div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((asset) => {
              const pl = assetPL(asset);
              return (
                <article key={asset.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{categoryLabels[asset.category]}</p>
                      <h3 className="truncate text-base font-bold tracking-tight text-ink-900">{asset.name}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${pl.isProfit ? "border-flow-in-line bg-flow-in-bg text-flow-in-text" : "border-flow-out-line bg-flow-out-bg text-flow-out-text"}`}>
                      {pl.isProfit ? "+" : ""}{pl.pct}%
                    </span>
                  </div>

                  <p className="tabular mt-3 text-2xl font-extrabold tracking-tight text-ink-900">{rupiah.format(asset.currentPrice)}</p>
                  <p className="tabular text-xs text-ink-500">Beli: {rupiah.format(asset.buyPrice)} · P/L: <strong className={pl.isProfit ? "text-flow-in-text" : "text-flow-out-text"}>{pl.isProfit ? "+" : ""}{rupiah.format(pl.diff)}</strong></p>
                  {asset.note && <p className="mt-1 truncate text-xs text-ink-500">{asset.note}</p>}

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => { setEditingPriceId(editingPriceId === asset.id ? null : asset.id); setSellingId(null); }}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-slate-50"
                    >
                      {editingPriceId === asset.id ? "Tutup" : "Ubah nilai kini"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSellingId(sellingId === asset.id ? null : asset.id); setEditingPriceId(null); }}
                      className="rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-semibold text-white"
                    >
                      {sellingId === asset.id ? "Tutup" : "Jual aset"}
                    </button>
                    <button type="button" onClick={() => deleteAsset(asset.id)} className="rounded-lg border border-flow-out-line bg-flow-out-bg px-2.5 py-1.5 text-xs font-semibold text-flow-out-text">Hapus</button>
                  </div>

                  {editingPriceId === asset.id && (
                    <UpdatePriceForm
                      asset={asset}
                      onSave={(val) => { updateAssetPrice(asset.id, val); setEditingPriceId(null); }}
                    />
                  )}
                  {sellingId === asset.id && (
                    <SellForm
                      asset={asset}
                      data={data}
                      onSubmit={(f) => { sellAsset(f); setSellingId(null); }}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Sold Assets */}
      {sold.length > 0 && (
        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="text-sm font-bold text-ink-900">Aset yang sudah terjual ({sold.length})</h2>
          <p className="mt-0.5 text-xs text-ink-500">Hasil jual sudah masuk ke dompet atau luar dompet, tidak double-count di total aset.</p>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {sold.map((asset) => {
              const pl = assetPL(asset);
              return (
                <li key={asset.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{asset.name} <small className="text-ink-500">({categoryLabels[asset.category]})</small></p>
                    <p className="tabular text-xs text-ink-500">Beli {rupiah.format(asset.buyPrice)} → Terjual {rupiah.format(asset.sellPrice ?? 0)} pada {asset.sellDate}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`tabular text-xs font-bold ${pl.isProfit ? "text-flow-in-text" : "text-flow-out-text"}`}>
                      {pl.isProfit ? "+" : ""}{rupiah.format(pl.diff)} ({pl.pct}%)
                    </span>
                    <button type="button" onClick={() => deleteAsset(asset.id)} className="text-xs font-semibold text-flow-out-text">Hapus</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Add New Asset Form */}
      <section className="max-w-md rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-bold text-ink-900">Catat aset baru</h2>
        <p className="mb-3 mt-0.5 text-xs text-ink-500">Beli dari dompet (potong saldo) atau di luar dompet.</p>
        <NewAssetForm data={data} balances={balances} onSubmit={addAsset} />
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

function NewAssetForm({ data, balances, onSubmit }: { data: FinanceData; balances: Record<string, number>; onSubmit: (form: FormData) => void }) {
  const [walletId, setWalletId] = useState("outside");

  return (
    <form action={(form) => onSubmit(form)} className="grid gap-3">
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Nama aset</span>
        <input name="name" required placeholder="Contoh: Emas Antam 10g / Saham BBCA" className={inputCls} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Kategori</span>
        <select name="category" className={inputCls}>
          <option value="emas">Emas & Logam Mulia</option>
          <option value="saham">Saham & Reksa Dana</option>
          <option value="properti">Properti & Tanah</option>
          <option value="ternak">Ternak & Hewan</option>
          <option value="barang">Barang & Koleksi</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Harga beli</span>
        <input name="buyPrice" inputMode="numeric" required placeholder="Contoh: 10000000" className={`${inputCls} tabular`} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Sumber dana beli</span>
        <select name="buyWalletId" value={walletId} onChange={(e) => setWalletId(e.target.value)} className={inputCls}>
          <option value="outside">Di luar dompet (tidak memotong saldo)</option>
          {data.wallets.map((wallet) => (
            <option value={wallet.id} key={wallet.id}>
              {wallet.name} (saldo {rupiah.format(balances[wallet.id] ?? 0)})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Tanggal beli</span>
        <input name="buyDate" type="date" defaultValue={today} required className={inputCls} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-ink-700">Catatan</span>
        <input name="note" placeholder="Contoh: Beli di Butik LM" className={inputCls} />
      </label>
      <button className="rounded-lg bg-ink-900 px-3 py-2.5 text-sm font-semibold text-white" type="submit">Simpan aset</button>
    </form>
  );
}

function UpdatePriceForm({ asset, onSave }: { asset: Asset; onSave: (newPrice: number) => void }) {
  const [price, setPrice] = useState(asset.currentPrice);

  return (
    <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3">
      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">Nilai kini baru</span>
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value) || 0)}
          className={`${inputCls} tabular`}
        />
      </label>
      <button
        type="button"
        onClick={() => onSave(price)}
        className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white"
      >
        Simpan nilai
      </button>
    </div>
  );
}

function SellForm({ asset, data, onSubmit }: { asset: Asset; data: FinanceData; onSubmit: (form: FormData) => void }) {
  const [walletId, setWalletId] = useState(data.wallets[0]?.id ?? "outside");

  return (
    <form action={(form) => onSubmit(form)} className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3">
      <input type="hidden" name="assetId" value={asset.id} />
      <p className="text-xs font-semibold text-ink-900">Jual {asset.name}</p>
      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">Harga jual</span>
        <input name="sellPrice" inputMode="numeric" required placeholder={String(asset.currentPrice)} className={`${inputCls} tabular`} />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">Masuk ke dompet</span>
        <select name="sellWalletId" value={walletId} onChange={(e) => setWalletId(e.target.value)} className={inputCls}>
          {data.wallets.map((wallet) => (
            <option value={wallet.id} key={wallet.id}>{wallet.name}</option>
          ))}
          <option value="outside">Di luar dompet (tidak catat income)</option>
        </select>
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-semibold text-ink-700">Tanggal jual</span>
        <input name="sellDate" type="date" defaultValue={today} required className={inputCls} />
      </label>
      <button className="rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white" type="submit">Catat penjualan</button>
    </form>
  );
}

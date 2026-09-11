import type { FinanceData, LedgerFilter } from "../../lib/types";
import LedgerTable from "../dashboard/LedgerTable";

export default function HistoryView({ data, filter, setFilter }: { data: FinanceData; filter: LedgerFilter; setFilter: (filter: LedgerFilter) => void }) {
  return (
    <div className="grid max-w-5xl gap-5">
      <LedgerTable data={data} filter={filter} setFilter={setFilter} />
      <p className="text-xs text-ink-500">Transfer tercatat sebagai pasangan keluar-masuk dengan grup yang sama, sehingga total saldo tidak berubah.</p>
    </div>
  );
}

# CODE STYLE AND CONVENTIONS

Dokumen Penanggung Jawab: PEREKAYASA (Direktorat II: Teknologi & Rekayasa)
Target Pembaca AI: Claude Code, Cursor, Codex, dan seluruh instans agen koding.
Status Dokumen: Disetujui (Baseline Hasil Rekayasa Balik Sistem Eksisting)
Versi: 1.1.0

---

## 01 General Principles
1. **Kejelasan di Atas Kepintaran (Clarity Over Cleverness)**: Tulis kode yang mudah dipahami manusia dan model bahasa. Hindari abstraksi berlebihan atau closure kompleks jika fungsi murni sederhana sudah mencukupi.
2. **Kering Ringkas (YAGNI & Anti-Bloat)**: Jangan membuat lapisan factory atau repository pattern yang tidak dibutuhkan. Struktur modul di `src/lib/` memprioritaskan fungsi murni (*pure functions*) yang mudah diuji secara terisolasi.
3. **Ketik Ketat (Strict Typing Tanpa Any)**: Seluruh berkas wajib menggunakan TypeScript murni tanpa penggunaan tipe `any`. Jika tipe polimorfik diperlukan, gunakan `unknown` disertai penegasan tipe (*type narrowing*) atau serikat tipe terdiskriminasi (*discriminated unions*).
4. **Format Uang dan Angka Terstandarisasi**: Seluruh pemformatan mata uang wajib melalui instance global `rupiah` (`Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })`) di `src/lib/finance.ts`.

## 02 Naming Conventions
- **Berkas Komponen React:** PascalCase, contoh: `DashboardView.tsx`, `TransactionModals.tsx`, `MetricCard.tsx`.
- **Berkas Utilitas & Tipe:** camelCase atau kebab-case, contoh: `finance.ts`, `storage.ts`, `types.ts`.
- **Berkas Pengujian:** Ekstensi `.test.ts` atau `.test.tsx` berdampingan dengan berkas sumber, contoh: `finance.test.ts`, `storage.test.ts`.
- **Fungsi & Variabel:** camelCase, deskriptif dan mencerminkan domain keuangan, contoh: `calculateBalances()`, `splitIncome()`, `totalBalance`, `monthExpense`.
- **Konstanta Global:** UPPER_SNAKE_CASE atau camelCase baku, contoh: `STORAGE_KEY`, `REQUIRED_KEYWORD`, `DAYS`.
- **Tipe & Antarmuka (Interface):** PascalCase, dilarang menggunakan prefiks `I`, contoh: `FinanceData`, `LedgerEntry`, `IncomeType`, `Asset`.

## 03 React & Component Guidelines
- Gunakan komponen fungsional (*functional components*) secara eksklusif.
- Komponen presentasi dan tampilan diisolasi di dalam `src/components/views/` dan menerima data serta handler aksi melalui props.
- Wajib menangani 4 status data antarmuka secara eksplisit:
  1. **Idle (Normal):** Menampilkan data utama secara rapi.
  2. **Busy / Loading:** Ditandai melalui indikator `busy: boolean` dan animasi putaran ikon `RefreshCw` (`animate-spin`).
  3. **Empty State:** Menggunakan komponen atomik `<Empty label="..." />` saat data koleksi bernilai nol.
  4. **Error / Feedback:** Menggunakan komponen mengambang `<Toast message="..." onClose={...} />` untuk menyampaikan kegagalan atau konfirmasi aksi.

## 04 Import Ordering
Blok impor pada setiap berkas diatur rapi dan dikelompokkan dengan urutan berikut:
1. Pustaka eksternal inti (`react`, `@supabase/supabase-js`, `lucide-react`).
2. Modul logika bisnis dan utilitas lokal (`../../lib/finance`, `../../lib/storage`).
3. Komponen antarmuka lokal (`../ui/primitives`, `../dashboard/MetricCard`).
4. Impor tipe TypeScript murni (`import type { FinanceData, Wallet } from "../../lib/types"`).

## 05 Linting and Formatting
- Indentasi: 2 spasi konsisten.
- Titik koma (Semicolons): Wajib digunakan di setiap akhir pernyataan.
- Tanda Petik: Petik ganda (`"..."`) untuk atribut JSX dan string kode.
- Zero Emoji: Dilarang menyisipkan karakter emoji atau emoticon dalam kode sumber, komentar, maupun string teks UI.

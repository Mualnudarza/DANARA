# TESTING STRATEGY AND QUALITY ASSURANCE

Dokumen Penanggung Jawab: PENGUJI & AUDITOR (Direktorat III: Mutu & Keamanan)
Target Pembaca AI: Claude Code, Cursor, Codex, dan seluruh instans agen koding.
Status Dokumen: Disetujui (Baseline Hasil Rekayasa Balik Sistem Eksisting)
Versi: 1.1.0

---

## 01 Testing Strategy
Danara menitikberatkan pengujian pada kalkulasi keuangan murni serta autentikasi dan kegagalan cloud yang wajib memblokir akses data.

- **Unit:** logika keuangan dan nilai default (Vitest).
- **Integrasi:** autentikasi, query Supabase, dan propagasi error.
- **UI:** login wajib, pemuatan cloud, serta blokir offline.

Test files berada berdampingan dengan modul terkait di `src/lib/`.

```text
Test files berada berdampingan dengan modul terkait di src/lib/.
```
## 02 Test File Conventions
- **Lokasi Berkas Uji:** Diletakkan berdampingan dengan berkas sumber yang diuji di dalam direktori `src/lib/`.
- **Pola Penamaan:** `[NamaModul].test.ts`.
- **Struktur Blok Pengujian:**
  - `describe("nama fungsi/modul", () => { ... })`
  - `it("should [ekspektasi perilaku] when [kondisi]", () => { ... })`
  - Pola AAA (*Arrange, Act, Assert*) diterapkan secara eksplisit.

## 03 Quality Gate Thresholds
Setiap penambahan atau modifikasi fitur wajib memenuhi kriteria gerbang mutu:
1. **100% Fungsi Finansial Teruji:** Seluruh fungsi di `src/lib/finance.ts` (`allocationTotal`, `isValidAllocation`, `splitIncome`, `entryNet`, `calculateBalances`, `dashboardSummary`, `targetProgress`, `debtRemaining`, `debtTotals`, `assetValue`, `assetPL`, `activeAssetsTotal`, `groupByDay`, `newTransfer`) wajib memiliki unit test pendukung.
2. **Zero Rounding Leakage Verification:** Pengujian `splitIncome` wajib memverifikasi bahwa pemecahan nominal ganjil (misal Rp 100.001 ke 3 dompet) tidak kehilangan 1 Rupiah pun pada hasil pembagian.
3. **Build Status Bersih:** Perintah `npm run build` dan `npm test` wajib menghasilkan kode keluar 0 (*exit code 0*) tanpa galat tipe TypeScript atau kegagalan assertions.

## 04 Mocking Standards
Mock Supabase pada batas modul; pastikan kegagalan query tidak berubah menjadi data kosong yang tampak valid.

## 05 Useful Test Commands
```bash
# Menjalankan seluruh rangkaian pengujian otomatis
npm test

# Menjalankan pengujian dalam mode pengawasan perubahan (watch mode)
npx vitest

# Menjalankan kompilasi TypeScript dan bundler Vite untuk verifikasi build
npm run build
```

# TESTING STRATEGY AND QUALITY ASSURANCE

Dokumen Penanggung Jawab: PENGUJI & AUDITOR (Direktorat III: Mutu & Keamanan)
Target Pembaca AI: Claude Code, Cursor, Codex, dan seluruh instans agen koding.
Status Dokumen: Disetujui (Baseline Hasil Rekayasa Balik Sistem Eksisting)
Versi: 1.1.0

---

## 01 Testing Strategy & Pyramid
Danara menitikberatkan pengujian pada integritas kalkulasi keuangan murni dan persistensi state lokal untuk menjamin akurasi mutasi buku besar:

```text
       ▲
      / \     End-to-End Tests: Verifikasi alur UI mobile dan alur form transaksi
     /   \    Perkakas: Pengujian manual peramban & Playwright
    /─────\
   /       \   Integration Tests: Persistensi adapter localStorage & sinkronisasi Supabase
  /         \  Perkakas: Vitest, JSDOM (src/lib/storage.test.ts)
 /───────────\
/             \ Unit Tests: Logika keuangan murni, pemecahan alokasi, saldo, aset P/L
/               \ Perkakas: Vitest (src/lib/finance.test.ts)
─────────────────
```

## 02 Test File Conventions
- **Lokasi Berkas Uji:** Diletakkan berdampingan dengan berkas sumber yang diuji di dalam direktori `src/lib/`.
- **Pola Penamaan:** `[NamaModul].test.ts`.
- **Direktif Lingkungan Khusus:** Untuk modul yang berinteraksi dengan API peramban (seperti `localStorage`), wajib menyematkan direktif lingkungan pada baris pertama:
  ```typescript
  // @vitest-environment jsdom
  ```
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
- Pengujian modul `src/lib/storage.ts` memanfaatkan lingkungan simulasi JSDOM untuk mengisolasi `window.localStorage`.
- Setiap blok pengujian wajib membersihkan memori lokal sebelum dan sesudah uji dijalankan via `localStorage.clear()` guna mencegah polusi state antar-spesifikasi.

## 05 Useful Test Commands
```bash
# Menjalankan seluruh rangkaian pengujian otomatis
npm test

# Menjalankan pengujian dalam mode pengawasan perubahan (watch mode)
npx vitest

# Menjalankan kompilasi TypeScript dan bundler Vite untuk verifikasi build
npm run build
```

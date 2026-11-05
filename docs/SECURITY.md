# SECURITY POLICY AND THREAT MODEL

Dokumen Penanggung Jawab: PENGUJI (Direktorat III: Mutu & Keamanan)
Target Pembaca AI: Claude Code, Cursor, Codex, dan seluruh instans agen koding.
Status Dokumen: Disetujui (Baseline Hasil Rekayasa Balik Sistem Eksisting)
Versi: 1.1.0

---

## 01 General Security Rules
1. **Larangan Keras Kredensial Hardcoded**: Kunci anon publik Supabase dan URL basis data dimuat murni melalui variabel lingkungan Vite (`import.meta.env.VITE_SUPABASE_URL` dan `import.meta.env.VITE_SUPABASE_ANON_KEY`). Kunci rahasia layanan (*service role key*) dilarang keras disertakan dalam bundel frontend.
2. **Penggunaan Variabel Lingkungan (.env)**: Berkas `.env.local` dikecualikan dari Git melalui `.gitignore`. Dokumentasi variabel lingkungan disediakan di `.env.example`.
3. **Kedaulatan Data Lokal**: Dalam mode lokal (offline), seluruh data finansial hanya tersimpan di dalam memori peramban pengguna (`localStorage`), tanpa transmisi jaringan keluar ke server pihak ketiga mana pun.

## 02 Input Validation & Trust Boundaries
- **Sanitasi Masukan Numerik**: Setiap masukan uang melalui formulir diproses menggunakan parser utilitas `inputNumber(value: string)` yang mengeksekusi pembersihan karakter non-digit melalui ekspresi reguler `value.replace(/\D/g, "")`.
- **Validasi Integritas Saldo**: Sebelum mutasi transaksi pengeluaran atau transfer dieksekusi, sistem memeriksa apakah saldo dompet sumber mencukupi (`amount <= (balances[walletId] ?? 0)`).
- **Validasi Total Alokasi 100%**: Pembagian pemasukan ditolak keras oleh sistem apabila total penjumlahan persentase dompet tidak bernilai tepat 100% (`isValidAllocation() === true`).
- **Pencegahan Cross-Site Scripting (XSS)**: Seluruh render teks menggunakan mekanisme bawaan React JSX yang secara otomatis melakukan *HTML escaping*. Penggunaan atribut `dangerouslySetInnerHTML` dilarang mutlak di seluruh komponen aplikasi.

## 03 Authentication & Authorization (Supabase Cloud Sync)
- **Protokol OAuth PKCE**: Otentikasi cloud menggunakan Google OAuth via Supabase Auth dengan alur aman Proof Key for Code Exchange (PKCE).
- **Session Resilience**: Klien Supabase dikonfigurasi dengan:
  ```typescript
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
  ```
  Hal ini mencegah hilangnya sesi pengguna secara tiba-tiba saat membuka aplikasi di peramban mobile (iOS Safari / Android Chrome).
- **Row Level Security (RLS) Mandatori**: Seluruh 9 tabel di PostgreSQL Supabase (`wallets`, `wallet_targets`, `income_types`, `ledger_entries`, `allocation_logs`, `transfers`, `debts`, `debt_payments`, `assets`) dilindungi kebijakan RLS ketat:
  ```sql
  create policy "Users manage own rows" on [tabel]
    for all to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  ```
  Klien dari satu pengguna terbukti secara kriptografis tidak dapat membaca maupun memodifikasi baris data milik pengguna lain.

## 04 Mitigasi Penghapusan Data Permanen (Danger Zone Gate)
Untuk mencegah insiden kehilangan data finansial akibat ketidaksengajaan klik (*accidental wiping*), fitur reset data menerapkan 3 gerbang validasi ketat pada `DangerResetModal.tsx`:
1. **Gerbang 1 (Katalog Dampak):** Penjabaran eksplisit daftar seluruh 5 kategori data yang akan musnah.
2. **Gerbang 2 (Pernyataan Resiko):** Checkbox persetujuan sadar bahwa data tidak dapat dipulihkan.
3. **Gerbang 3 (Pengetikan Kata Kunci):** Kolom input validasi yang mewajibkan pengguna mengetik kata `HAPUS SEMUA` secara presisi (case-insensitive).
Tombol eksekusi dikunci (*disabled*) hingga ketiga gerbang tersebut terpenuhi secara serentak.

## 05 Security Audit Checklist
Sebelum penggabungan kode baru ke cabang `main`:
- Tidak ada token API atau kredensial rahasia yang tertinggal dalam berkas atau riwayat commit git.
- Build produksi Vite tidak mengekspos variabel lingkungan rahasia.
- Seluruh migrasi SQL baru pada folder `supabase/migrations/` wajib menyertakan perintah `alter table ... enable row level security;` dan kebijakan RLS berbasis `auth.uid() = user_id`.
- Pemeriksaan dependensi melalui `npm audit` tidak menemukan kerentanan tingkat kritis (*high/critical vulnerabilities*).

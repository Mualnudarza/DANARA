# PRODUCT REQUIREMENTS DOCUMENT (PRD)

Dokumen Penanggung Jawab: ANALIS (Direktorat I: Bisnis & Pengetahuan)
Target Pembaca AI: Claude Code, Cursor, Codex, dan seluruh instans agen koding.
Status Dokumen: Disetujui (Baseline Hasil Rekayasa Balik Sistem Eksisting)
Versi: 1.1.0

---

## 01 Product Overview
- **Product Name:** Danara (Personal Finance Management)
- **Tagline:** Aplikasi Manajemen Keuangan Personal Local-First Berbasis Alokasi Pendapatan Proporsional.
- **Description:** Danara adalah platform pencatatan keuangan pribadi mandiri yang membagi pendapatan secara otomatis ke kantong-kantong dompet persentase, mengelola hutang piutang dengan pelunasan terhubung, melacak portofolio aset multi-kategori, dan menjamin kedaulatan data melalui arsitektur local-first tanpa kewajiban login.

## 02 Problem
1. **Friksi Pencatatan Saat Transaksi Berlangsung**: Aplikasi keuangan berbasis cloud murni seringkali mengharuskan pengguna login ulang atau terhambat koneksi internet lambat saat ingin mencatat pengeluaran harian di kasir, menyebabkan pengguna menunda dan akhirnya lupa mencatat.
2. **Kompleksitas Anggaran Amplop (Envelope Budgeting)**: Membagi pendapatan bulanan ke berbagai pos tabungan/pengeluaran secara manual memerlukan perhitungan rumit dan rawan salah alokasi jika dilakukan secara terpisah.
3. **Penyebaran Data Finansial yang Terfragmentasi**: Catatan kas harian, hutang piutang antar teman/keluarga, dan portofolio aset fisik/investasi (emas, saham, properti) biasanya dicatat di aplikasi berbeda atau spreadsheet terpisah yang tidak nyaman diakses di ponsel.
4. **Resiko Kehilangan Privasi Finansial**: Banyak pengguna keberatan data transaksi dan aset mereka disimpan di server pihak ketiga tanpa kejelasan tata kelola privasi.

## 03 Goal
Menyediakan instrumen pencatatan keuangan mobile-first yang instan (latensi interaksi di bawah 100ms), menjamin kedaulatan data pribadi di peramban lokal tanpa hambatan login wajib, serta mengotomasi pembagian alokasi dana secara proporsional (tepat 100%) dengan integritas buku besar ganda (double-entry ledger).

## 04 Target Users
- **Individu Berpenghasilan Tetap atau Lepas**: Profesional, freelancer, atau pekerja yang mengelola pendapatan berkala dan menerapkan disiplin persentase alokasi dana (misal: 50% kebutuhan pokok, 30% operasional, 20% tabungan masa depan).
- **Pengguna Sadar Privasi (Privacy-Conscious)**: Pengguna yang mengutamakan keamanan data finansial dan memilih penyimpanan lokal di peramban tanpa kewajiban menyerahkan email atau data identitas ke server pihak ketiga.
- **Pemilik Portofolio Multi-Instrumen**: Individu yang memiliki kewajiban hutang/piutang aktif serta aset fisik/investasi (emas, ternak, barang koleksi, saham) dan memerlukan dasbor pemantauan nilai bersih (net worth) secara terpadu.

## 05 Core Features (Version 1)
Fitur inti yang wajib berfungsi tanpa kesalahan dan telah diimplementasikan:

1. **Multi-Wallet & Savings Target**:
   - Pembuatan dan pengelolaan dompet tanpa batas dengan penamaan akun, kode warna hex visual, dan penetapan target saldo nominal.
   - Perhitungan persentase progres capaian target dan sisa nominal menuju target secara otomatis.

2. **Proportional Income Allocation (Sistem Alokasi Proporsional)**:
   - Pembuatan template tipe pemasukan dengan konfigurasi persentase per dompet yang wajib berjumlah tepat 100%.
   - Otomasi pemecahan nominal pemasukan kotor ke masing-masing dompet saat pencatatan transaksi masuk, menghasilkan entri ledger terisolasi dan log audit alokasi.

3. **Double-Entry Ledger & Fund Transfer**:
   - Pencatatan pengeluaran kas dengan validasi saldo dompet mencukupi.
   - Pindah saldo (transfer) antar-dompet berpasangan (`transfer-out` dan `transfer-in`) dengan ID grup seragam, memastikan total saldo bersih sistem tetap konsisten (zero-drift).

4. **Debt & Credit Management (Hutang & Piutang)**:
   - Pelacakan hutang (kewajiban membayar) dan piutang (hak menerima pengembalian) secara terpisah.
   - Fitur top-up nominal hutang berjalan serta pembayaran/penerimaan angsuran yang terhubung langsung ke mutasi saldo dompet kas terpilih.
   - Status pelunasan otomatis atau manual.

5. **Multi-Category Asset Portfolio Tracking**:
   - Pencatatan aset dalam 6 kategori: Saham & Reksa Dana, Emas & Logam Mulia, Properti & Tanah, Ternak & Hewan, Barang & Koleksi, serta Lainnya.
   - Pembaruan harga pasar terkini (current price) secara berkala dan kalkulasi otomatis performa keuntungan/kerugian (Profit/Loss nominal dan persentase).
   - Eksekusi penjualan aset dengan opsi memasukkan hasil penjualan ke dompet kas terpilih.

6. **6-Metric Executive KPI Dashboard**:
   - Dasbor ringkas menyajikan 6 kartu metrik utama: Total Saldo Terkonsolidasi, Pemasukan Bulan Berjalan, Pengeluaran Bulan Berjalan, Net Arus Kas Bulanan, Nilai Portofolio Aset Aktif, dan Posisi Hutang Bersih (Piutang dikurangi Hutang).
   - Distribusi saldo per dompet visual dengan progress bar capaian target.

7. **Visual Transaction Calendar**:
   - Agregasi mutasi harian berbasis tampilan kalender bulanan.
   - Indikator visual nominal masuk (+), keluar (-), dan transfer per tanggal yang dapat difilter per hari terpilih.

8. **Local-First Architecture with Optional Cloud Sync**:
   - Operasi 100% mandiri secara offline menggunakan `localStorage` peramban.
   - Opsi menghubungkan akun Google OAuth untuk sinkronisasi dua arah ke basis data PostgreSQL Supabase dengan perlindungan Row Level Security (RLS).

9. **Tiered Danger Zone Reset**:
   - Mekanisme perlindungan data bertingkat 3 lapis untuk mereset seluruh data aplikasi:
     1. Ringkasan eksplisit item yang akan dihapus permanen.
     2. Kotak centang pernyataan persetujuan resiko.
     3. Pengetikan kata kunci wajib `HAPUS SEMUA` secara presisi.

## 06 Out of Scope (For Now)
Fungsionalitas berikut secara sadar TIDAK dibangun pada versi saat ini:
- Integrasi API perbankan otomatis (Open Finance / Webhook mutasi bank BCA, Mandiri, BRI).
- Dukungan multi-mata uang (kurs valuta asing di luar Rupiah IDR).
- Perhitungan dan pelaporan pajak penghasilan otomatis (PPh 21 / PPh Final).
- Fitur kolaborasi banyak pengguna dalam satu buku kas (multi-user shared ledger).
- Pengenalan tanda terima belanja via kamera (OCR receipt scanner).
- Notifikasi latar belakang push via Service Worker.

## 07 Success Metrics
- **Latensi Transaksi Lokal:** Di bawah 100ms untuk setiap pencatatan transaksi masuk, keluar, maupun transfer.
- **Integritas Neraca Saldo:** Zero balance drift; selisih saldo antar transfer wajib tepat 0 Rupiah.
- **Kestabilan Mobile:** Tidak ada layout shift, tumpang tindih elemen navigasi, atau tabrakan header pada layar ponsel lebar 360px hingga 430px.
- **Ketahanan Offline:** 100% fungsionalitas pencatatan dapat berjalan tanpa sambungan internet aktif.
- **Kualitas Kode:** 100% pengujian unit lolos pada Vitest, dan build produksi TypeScript bersih dari tipe `any`.

## 08 Acceptance Criteria
- Semua fungsi utilitas kalkulasi keuangan di `src/lib/finance.ts` terverifikasi oleh test suite Vitest.
- Bottom dock 5-tab navigasi mobile terkunci stabil di dasar viewport pada seluruh view tanpa menutupi item transaksi terbawah di `HistoryView` maupun `MenuView`.
- Tombol aksi tengah dock `+` memicu Express Action Sheet dengan 3 opsi mutasi (Dana Masuk, Dana Keluar, Pindah Saldo) yang mudah disentuh dengan satu jempol tangan kanan/kiri.
- Formulir transaksi mobile menyediakan chip preset nominal cepat (`+10rb`, `+20rb`, `+50rb`, `+100rb`, `+500rb`, `Reset`) dan sticky footer tombol simpan di atas keyboard ponsel.
- Dasbor ponsel menampilkan kartu Hero Saldo terkonsolidasi dan bar chip ringkas horizontal untuk metrik sekunder, sedangkan dasbor desktop mengadopsi tata letak Dual-Column Clean (1.1fr ringkasan / 0.9fr mutasi & aksi).
- Tab Menu menyajikan Hub navigasi menuju modul sekunder: Portofolio Aset, Hutang & Piutang, Kalender Transaksi, serta Pengaturan & Akun.
- Fitur reset data hanya dapat dieksekusi setelah ketiga gerbang validasi terpenuhi secara sempurna.

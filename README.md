# Danara - Personal Finance Management

Dokumen Penanggung Jawab: KURATOR & ANALIS (Direktorat I: Bisnis & Pengetahuan)
Fungsi Berkas: Panduan Orientasi Pengembang Manusia (Human Onboarding Guide)
Status: Aktif (Versi 1.1.0 - Local-First & Mobile-First)

---

## 1. Deskripsi Proyek
Danara adalah aplikasi web manajemen keuangan personal berbasis *local-first* yang dirancang untuk mengotomasi pembagian alokasi pendapatan secara proporsional ke pos-pos dompet, mencatat mutasi pengeluaran dan perpindahan saldo (double-entry ledger), mengelola hutang piutang aktif, serta melacak valuasi portofolio aset multi-kategori secara terpadu.

Aplikasi memprioritaskan kedaulatan data pengguna dengan menyimpan data secara instan di peramban lokal (`localStorage`) tanpa mewajibkan login, namun tetap menyediakan opsi sinkronisasi dua arah ke basis data PostgreSQL Supabase yang dilindungi Row Level Security (RLS).

Untuk membaca spesifikasi lengkap perancangan sistem informasi, silakan pelajari dokumen di direktori `docs/`:
- Spesifikasi Produk & Lingkup MVP: [docs/PRD.md](docs/PRD.md)
- Arsitektur Sistem & Alur Data: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Standar Desain Visual & Token Hex: [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)
- Konvensi Kode TypeScript: [docs/CODE-STYLE.md](docs/CODE-STYLE.md)
- Kebijakan Keamanan & Model Ancaman: [docs/SECURITY.md](docs/SECURITY.md)
- Strategi Pengujian & QA: [docs/TESTING.md](docs/TESTING.md)
- Protokol Agen Koding AI: [AGENTS.md](AGENTS.md)

Diagram visual sistem mandiri dapat dibuka langsung di peramban:
- Diagram Arsitektur Sistem: [diagrams/system-architecture.html](diagrams/system-architecture.html)
- Diagram Skema Basis Data Relasional: [diagrams/database-schema.html](diagrams/database-schema.html)

## 2. Prasyarat Sistem
Pastikan lingkungan pengembangan lokal telah terpasang:
- Node.js versi 20.x LTS atau lebih baru
- Manajer paket npm (atau pnpm / yarn)
- Git untuk kontrol versi
- (Opsional) Akun Supabase jika ingin mengaktifkan pencadangan cloud

## 3. Konfigurasi Lingkungan (.env)
Salin berkas contoh variabel lingkungan dan sesuaikan nilainya:

```bash
cp .env.example .env.local
```

Isi variabel pada `.env.local`:
```text
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

Catatan: Danara tetap dapat berjalan 100% penuh secara offline dalam Mode Lokal meskipun variabel lingkungan Supabase dikosongkan.

## 4. Instalasi dan Eksekusi Lokal
Jalankan langkah berikut secara berurutan:

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server pengembangan lokal Vite
npm run dev
```

Buka peramban pada alamat `http://localhost:5173`.

## 5. Menjalankan Pengujian & Verifikasi Build
```bash
# Menjalankan seluruh pengujian unit otomatis
npm test

# Menjalankan kompilasi TypeScript dan build produksi
npm run build
```

## 6. Protokol Agen Koding AI
Jika mengembangkan proyek ini menggunakan Claude Code, Cursor, atau Codex:
- Agen wajib membaca aturan di [AGENTS.md](AGENTS.md) sebelum memulai pekerjaan.
- Dilarang menambahkan dependensi, mengubah palet warna hex, atau melanggar aturan tanpa memperbarui dokumen di folder [docs/](docs/).
- Dilarang menyematkan karakter emoji pada seluruh antarmuka, kode sumber, maupun pesan log sistem.

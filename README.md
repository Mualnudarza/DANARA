# Danara - Personal Finance Management

Dokumen Penanggung Jawab: KURATOR & ANALIS (Direktorat I: Bisnis & Pengetahuan)
Fungsi Berkas: Panduan Orientasi Pengembang Manusia (Human Onboarding Guide)
Status: Aktif (Versi 1.1.0 - Cloud-Only & Mobile-First)

---

## 1. Deskripsi Proyek
Danara adalah aplikasi web manajemen keuangan personal berbasis cloud yang mengotomasi alokasi pendapatan, mencatat mutasi dan perpindahan saldo (double-entry ledger), mengelola hutang piutang, serta melacak portofolio aset multi-kategori.

Login Google wajib. Data hanya disimpan di PostgreSQL Supabase dengan perlindungan Row Level Security (RLS); aplikasi memblokir akses saat offline dan tidak menggunakan cache finansial lokal.

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
- Akun Supabase yang telah dikonfigurasi untuk autentikasi Google dan penyimpanan data cloud

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

Danara memerlukan variabel lingkungan Supabase dan koneksi internet. Jika autentikasi atau pembacaan data cloud gagal, aplikasi tidak menampilkan data finansial.

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

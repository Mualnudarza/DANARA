# AGENT OPERATIONAL RULES AND CONTEXT LOADER

Dokumen Penanggung Jawab: ORKESTRATOR (Lintas Direktorat / Chief of Staff)
Lokasi Berkas: Root Repositori Proyek (`AGENTS.md`)
Target Pembaca AI: Seluruh instans agen koding (Claude Code, Cursor, Codex, Windsurf).
Status Dokumen: Disetujui
Versi: 1.1.0

---

## 01 Purpose
Berkas ini memuat instruksi operasional, batas kendali teknis, dan protokol wajib bagi seluruh agen kecerdasan buatan yang beroperasi di repositori Danara. Setiap sesi koding wajib mematuhi panduan ini secara disiplin.

## 02 Before You Start (Pre-Flight Checklist)
Sebelum menulis atau memodifikasi satu baris kode pun, agen AI wajib menjalankan pemeriksaan awal:
1. **Pahami Batasan Produk**: Baca `docs/PRD.md` untuk memahami visi produk, fitur inti, dan batasan `Out of Scope`. Dilarang keras menginisiasi fitur yang tidak tercantum dalam PRD.
2. **Kunci Aturan Visual**: Baca `docs/DESIGN-SYSTEM.md` sebelum menyentuh antarmuka UI. Jangan gunakan warna, font, atau skala jarak arbitrer di luar token resmi.
3. **Patuhi Denah Arsitektur**: Baca `docs/ARCHITECTURE.md` sebelum membuat berkas baru, mengubah skema, atau menambah dependensi.
4. **Verifikasi Standar Kode & Mutu**: Baca `docs/CODE-STYLE.md`, `docs/SECURITY.md`, dan `docs/TESTING.md`.
5. **Audit Komponen Eksisting**: Selalu periksa direktori `src/components/` dan utilitas `src/lib/` sebelum membuat fungsi baru guna mencegah duplikasi logika.

## 03 Multi-Agent Role Delegation (MUALNURDARZA Standard)
Jika proyek dikembangkan menggunakan sistem multi-agen terpadu, delegasikan tugas ke ranah domain yang sesuai:
- **ANALIS (Direktorat I)**: Pengelola dokumen `docs/PRD.md`, perumusan kebutuhan finansial, dan pemodelan alur bisnis.
- **KURATOR (Direktorat I)**: Pengelola dokumen `README.md`, orientasi pengembang, dan integrasi repositori.
- **PERANCANG (Direktorat II)**: Pengelola `docs/DESIGN-SYSTEM.md`, kepatuhan palet warna heksadesimal, ergonomi mobile, dan tata letak responsif.
- **PEREKAYASA (Direktorat II)**: Pengelola `docs/ARCHITECTURE.md` dan `docs/CODE-STYLE.md`, penulisan kode TypeScript, skema Supabase, dan logika kalkulasi finansial murni.
- **PENGUJI (Direktorat III)**: Pengelola `docs/SECURITY.md` dan `docs/TESTING.md`, model ancaman, sanitasi masukan, dan pengujian unit Vitest.
- **AUDITOR (Direktorat III)**: Verifikator kepatuhan gerbang mutu (*quality gate*) sebelum commit atau penggabungan kode.
- **ORKESTRATOR**: Koordinasi lintas agen, pemantauan status, dan konfirmasi penyelesaian tugas ke pengguna.

## 04 General Engineering Rules
- **Bahasa Utama**: Seluruh basis kode wajib menggunakan TypeScript murni dengan tipe ketat (dilarang menggunakan tipe `any`).
- **Prinsip Modular**: Satu komponen hanya bertanggung jawab atas satu fungsi (*Single Responsibility Principle*).
- **Larangan Berkas Sampah**: Jangan membuat berkas sementara, skrip uji lepas, atau salinan cadangan di dalam direktori kerja.
- **Tanpa Karakter Emoji (Zero Emoji)**: Dilarang menyematkan karakter emoji pada kode sumber, komentar, teks antarmuka, maupun log sistem.
- **Kepatuhan Desain Mutlak**: Hanya gunakan palet warna heksadesimal dan skala jarak 8px yang tercantum dalam `docs/DESIGN-SYSTEM.md`.
- **Ketahanan Mobile-First**: Pastikan seluruh perubahan komponen teruji berfungsi utuh pada layar ponsel pintar (lebar 360px - 430px) tanpa tabrakan vertikal atau tumpang tindih elemen navigasi bawah.

## 05 Security Directives
- Dilarang keras menuliskan kunci API, rahasia otentikasi, atau token akses di dalam kode sumber.
- Seluruh variabel lingkungan dimuat melalui berkas `.env.local` yang tidak dilacak Git.
- Validasi seluruh batas masukan pengguna dan bersihkan karakter non-digit pada input nominal uang.
- Pertahankan Row Level Security (RLS) pada seluruh tabel Supabase yang dibuat.

## 06 Useful Commands
```bash
npm install               # Instalasi seluruh dependensi resmi
npm run dev               # Menjalankan server pengembangan lokal
npm run build             # Kompilasi produksi dan pengecekan tipe TypeScript
npm test                  # Menjalankan seluruh rangkaian pengujian otomatis
```

## 07 When Unsure (Protokol Mitigasi Keraguan)
1. Periksa berkas kanonikal di dalam direktori `docs/`.
2. Pelajari implementasi yang sudah ada pada basis kode sebagai rujukan pola.
3. Jika terdapat ambiguitas arsitektur atau perubahan dependensi baru, tanyakan dan mintalah persetujuan pengguna sebelum melakukan tindakan. Dilarang menebak secara sepihak.

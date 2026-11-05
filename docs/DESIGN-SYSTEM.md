# DESIGN SYSTEM

Dokumen Penanggung Jawab: PERANCANG (Direktorat II: Teknologi & Rekayasa)
Target Pembaca AI: Claude Code, Cursor, Codex, dan seluruh instans agen koding.
Status Dokumen: Disetujui (Baseline Hasil Rekayasa Balik Sistem Eksisting)
Versi: 1.1.0

---

## 01 Brand Identity
Danara mengusung identitas visual: **Fungsional, Bersih, Presisi, Tenang, Mobile-First, Bebas Emotikon/Slop**. Antarmuka dirancang untuk kenyamanan membaca angka-angka finansial secara cepat dalam kondisi satu tangan (single-hand ergonomics) di ponsel cerdas.

## 02 Colour Palette
Dilarang keras menggunakan nilai warna arbitrer di luar tabel heksadesimal yang telah ditetapkan pada `src/styles/tokens.css`:

| Nama Token | Nilai Hex | Variabel CSS | Peruntukan Elemen |
|---|---|---|---|
| Canvas | #F8FAFC | `--color-canvas` | Latar belakang dasar halaman aplikasi (Slate 50) |
| Surface | #FFFFFF | `--color-surface` | Kartu konten, lembar modal, dropdown, panel input |
| Line / Border | #E2E8F0 | `--color-line` | Pembatas kontainer, garis tabel, pemisah navigasi |
| Ink 900 (Primary) | #0F172A | `--color-ink-900` | Judul tebal, angka nominal utama, tombol aksi primer |
| Ink 700 (Body) | #334155 | `--color-ink-700` | Teks bacaan utama, label formulir, deskripsi aktif |
| Ink 500 (Muted) | #64748B | `--color-ink-500` | Teks keterangan, caption, sub-label, placeholder |
| Flow In Background | #ECFDF5 | `--color-flow-in-bg` | Latar badge pemasukan, indikator surplus, target tercapai |
| Flow In Text | #047857 | `--color-flow-in-text` | Teks nominal masuk, persentase profit |
| Flow In Line | #A7F3D0` | `--color-flow-in-line` | Border badge pemasukan |
| Flow Out Background | #FFF1F2 | `--color-flow-out-bg` | Latar badge pengeluaran, peringatan, rugi aset |
| Flow Out Text | #BE123C | `--color-flow-out-text` | Teks nominal keluar, persentase defisit |
| Flow Out Line | #FECDD3 | `--color-flow-out-line` | Border badge pengeluaran |
| Flow Move Background | #EEF2FF | `--color-flow-move-bg` | Latar badge transfer saldo antar-dompet |
| Flow Move Text | #4338CA | `--color-flow-move-text` | Teks indikator transfer |
| Flow Move Line | #C7D2FE | `--color-flow-move-line` | Border badge transfer |
| Rose Alert (Danger) | #E11D48 | `bg-rose-600` | Tombol reset data, indikator bahaya kritis |

## 03 Typography
- **Font Family Utama:** Plus Jakarta Sans (`@fontsource/plus-jakarta-sans`), fallback system-ui, sans-serif.
- **Standar Angka Finansial (Tabular Numbers):** Seluruh angka uang, tanggal, dan persentase wajib menggunakan kelas utilitas `.tabular` (`font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;`) agar lebar digit seragam dan tidak bergoyang saat nilai berubah.
- **Display Metric (Total Saldo):** 28px - 32px (Desktop), 20px - 24px (Mobile), Font-weight 800 (Extrabold), tracking -0.03em.
- **Header Seksi (H2):** 14px - 16px, Font-weight 700 (Bold), text-ink-900.
- **Body Regular:** 13px - 14px, Font-weight 500 / 600, text-ink-700.
- **Micro / Subtitle / Caption:** 10px - 12px, Font-weight 500, uppercase tracking-wider, text-ink-500.

## 04 Spacing & Viewport Ergonomics
- **Mobile Single Header:** Tinggi tepat 56px (`h-14`), sticky di `top-0`, z-index 40. Tidak boleh ada sub-header sekunder yang memicu tabrakan vertikal.
- **Mobile Bottom Navigation Bar:** Tinggi tepat 56px (`h-14`), fixed di `bottom-0`, z-index 40, border atas tipis `border-line`, latar `bg-surface/98` dengan efek blur.
- **Mobile Speed Dial FAB:** Terletak tepat di `bottom-[4.25rem] right-4`, z-index 40, berada di atas bottom navigation bar agar tidak menutupi tab menu.
- **Main Content Bottom Clearance:** Kontainer `<main>` wajib menerapkan `pb-24 lg:pb-8` agar elemen konten terbawah (terutama baris terakhir di tabel mutasi riwayat) tidak terpotong atau tertutup oleh bottom bar.
- **Skala Grid 8px Tailwind:** `p-2.5` (10px), `p-3` (12px), `p-4` (16px), `gap-2.5` (10px), `gap-3` (12px), `gap-4` (16px), `gap-5` (20px).

## 05 Border Radius
- Tag, Lencana (Badge), dan Indikator Status: `rounded-full` atau `rounded-md` (6px).
- Input, Tombol Aksi, Tombol Navigasi: `rounded-lg` (8px).
- Kartu Konten, Panel Seksi: `rounded-xl` (12px).
- Modal Dialog Shell & Bottom Sheet: `rounded-2xl` (16px) pada desktop; `rounded-t-2xl rounded-b-none` pada layar mobile.

## 06 Component Standards

1. **MetricCard (Kartu KPI Ringkasan)**:
   - Kontainer berkas: `src/components/dashboard/MetricCard.tsx`.
   - Latar belakang: `bg-surface`, border 1px solid `border-line`, bayangan halus `shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]`.
   - Opsi `tone`: `neutral` (ink-900), `in` (flow-in-text), `out` (flow-out-text).
   - Opsi `prominent`: Aksen visual lebih tebal dan latar sedikit lebih kontras untuk Total Saldo.

2. **WalletCard (Kartu Dompet Kas)**:
   - Kontainer berkas: `src/components/dashboard/WalletCard.tsx`.
   - Dilengkapi titik warna identitas dompet 8px (`h-2 w-2 rounded-full`).
   - Progress bar target tabungan tinggi 6px (`h-1.5 rounded-full bg-slate-100`) dengan bar aktif transisi halus yang berubah warna menjadi hijau `#10b981` saat target 100% tercapai.

3. **Modal Shell (Formulir Mengambang & Bottom Sheet)**:
   - Kontainer berkas: `src/components/ui/primitives.tsx`.
   - Layout responsif: Bertindak sebagai Bottom Sheet yang menempel di bawah pada layar ponsel (`items-end`), dan bertindak sebagai Modal Dialog melayang di tengah pada layar desktop (`sm:items-center`).
   - Batasan tinggi: `max-h-[90vh] overflow-y-auto` untuk memastikan formulir tidak terpotong pada layar HP pendek.

4. **Speed Dial Floating Action Button (FAB)**:
   - Terpasang pada `src/components/layout/AppLayout.tsx`.
   - Tombol pemicu lingkaran 52px (`h-13 w-13 rounded-full bg-ink-900`) dengan ikon plus yang berotasi 45 derajat saat menu terbuka.
   - Menu aksi cepat muncul melayang ke atas dengan 3 opsi berpita warna: Dana Masuk (Hijau), Dana Keluar (Merah), dan Pindah Saldo (Indigo).

5. **DangerResetModal (Gerbang Validasi 3 Lapis)**:
   - Kontainer berkas: `src/components/forms/DangerResetModal.tsx`.
   - Tombol eksekusi dinonaktifkan (`disabled:opacity-40 disabled:cursor-not-allowed`) hingga checkbox persetujuan dicentang DAN input teks persis mencocokkan kata `HAPUS SEMUA`.

## 07 Icons
- Pustaka Ikon Resmi: `lucide-react`.
- Karakter Ikon: Murni outline, garis tegas konsisten (stroke 1.5px hingga 2.4px untuk status aktif navigasi).
- Ukuran Standar: 14px (badge/inline hint), 16px (tombol aksi biasa), 18px-19px (navigasi utama), 24px (FAB trigger).

## 08 Breakpoints & Ergonomi Antarmuka
- **Mobile (`< 640px`):**
  - **Center Dock 5-Tab Bar**: Navigasi bawah terpasang tetap (`fixed inset-x-0 bottom-0 z-40 h-16`) dengan 4 tab modul primer (Beranda, Dompet, Riwayat, Menu) mengapit 1 tombol aksi utama melingkar di tengah (`+`).
  - **Express Action Sheet**: Tombol tengah membuka bottom sheet cepat dengan 3 opsi mutasi kontras tinggi: Dana Masuk (emerald), Dana Keluar (rose), dan Pindah Saldo (indigo).
  - **Form Input Transaksi Responsif**: Modal input mengadopsi pola bottom-sheet dengan preset chip nominal cepat (`+10rb`, `+20rb`, `+50rb`, `+100rb`, `+500rb`, `Reset`) dan sticky action footer di atas batas keyboard virtual ponsel.
  - **Hero Saldo & Glanceable Chips**: Dasbor ponsel memprioritaskan kartu Hero Saldo (total saldo + mutasi masuk/keluar bulan ini) dan bar chip horizontal ringkas (Net, Aset, Hutang Bersih), sehingga tabel transaksi terkini langsung terlihat di layar tanpa scroll berlebihan.
- **Tablet (`640px - 1024px`):** Tata letak kartu 2-3 kolom, modal dialog terpusat.
- **Desktop (`>= 1024px`):**
  - **Dual-Column Clean Canvas**: Dasbor membagi ruang kerja menjadi 2 kolom proporsional (1.1fr kolom kiri untuk ringkasan saldo & dompet, 0.9fr kolom kanan untuk input aksi cepat & riwayat mutasi buku besar).
  - Sidebar vertikal terkunci di kiri selebar 240px (`w-60`), topbar desktop dengan status kedaulatan data, navigasi dock bawah dan action sheet mobile disembunyikan.

## 09 Aturan Mutlak Antarmuka
1. **Zero Emoji:** Dilarang menggunakan karakter emoji atau emotikon pada seluruh kode sumber, teks tombol, judul, pesan toast, dan label formulir. Gunakan ikon Lucide berpasangan dengan teks yang jelas.
2. **Kepatuhan Palet Warna:** Dilarang menggunakan warna acak atau arbitrary Tailwind classes di luar token resmi.
3. **Pemberian Ruang Aman Bawah:** Setiap view baru yang ditambahkan wajib mempertahankan jarak aman terhadap bottom bar (`pb-4` internal view dan `pb-24` pada main layout).

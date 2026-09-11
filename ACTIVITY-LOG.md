# DANARA — Activity Log (Phase 1)

## Ringkasan
Migrasi penuh dari Google Sheets OAuth ke Supabase (auth + database + RLS),
dengan desain ulang memakai token Astryx neutral. Deploy target GitHub Pages
di `https://mualnudarza.github.io/DANARA/`.

## Stack akhir Phase 1
- React + Vite + TypeScript, `base: /DANARA/`
- Supabase Auth (Google provider) + Postgres + RLS per `user_id`
- Supabase Edge Function `danara` (validasi dan split alokasi)
- Styling token Astryx neutral, tanpa shadcn/ui

## Timeline commit (`main`)
- `3675116` Use Node 24 for Pages build — Vite 8 butuh Node modern, bukan 18.
- `f7398e8` Load Sheets data after OAuth sign-in — auto-load spreadsheet setelah login.
- `7259310` Migrate prototype to Supabase + Astryx neutral design — hapus
  `src/lib/google-sheets.ts`, tambah `src/lib/supabase.ts`, skema SQL awal,
  tema Astryx.
- `ee299bf` Restore full finance CRUD on Supabase branch — modal income,
  expense, transfer; CRUD dompet; pengaturan alokasi in-app; refresh Supabase.
- `4c48562` Merge Supabase migration, replacing Google Sheets auth — resolve
  konflik `src/App.tsx` ke versi Supabase.
- `6af4d6a` Inject Supabase env vars into Pages build — workflow membaca
  `secrets.VITE_SUPABASE_URL` dan `secrets.VITE_SUPABASE_ANON_KEY`.
- `e7991b1` Fix OAuth redirect to deployed base path — redirect memakai
  `BASE_URL` agar kembali ke `/DANARA/`, bukan root domain.

## Skema Supabase (Phase 1)
- `wallets` (id, user_id, name, account, color)
- `income_types` (id, user_id, name, allocations jsonb)
- `ledger_entries` (id, user_id, date, note, wallet_id, kind, amount, group_id, income_type_id)
- `allocation_logs` (id, user_id, date, income_type_id, amount, group_id)
- `transfers` (audit transfer antar-dompet)
- RLS: `20260912010000_rls.sql` — policy `authenticated` per `user_id` di semua tabel.

## Fitur yang jalan di akhir Phase 1
- Login Google via Supabase, redirect benar di dev (`:5173/DANARA/`) dan Pages (`/DANARA/`).
- Dashboard: total saldo, arus bulan ini, saldo per dompet, transaksi terakhir.
- Dana masuk: preview alokasi otomatis, validasi total 100%.
- Dana keluar: validasi saldo cukup.
- Pindah saldo: double-entry satu group ID, validasi dompet berbeda dan saldo cukup.
- Dompet: tambah/edit/hapus. Hapus ditolak bila ada riwayat transaksi.
- Tipe alokasi: tambah/edit/hapus di app. Hapus ditolak bila sudah dipakai riwayat.
- Refresh data dari Supabase dengan notifikasi.

## Konfigurasi manual yang sudah dilakukan
- Supabase project `zyifvcmijvawlzhrdqaz`: migrasi schema + RLS ter-push,
  function `danara` ter-deploy, Google provider aktif.
- GitHub repo secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  (publishable key, bukan service_role).
- Supabase URL config: Site URL dan Redirect URLs menunjuk `/DANARA/`
  dan `localhost:5173/DANARA/`.
- Google Cloud OAuth redirect tetap ke `https://zyifvcmijvawlzhrdqaz.supabase.co/auth/v1/callback`.

## Catatan keamanan
- Token OAuth yang sempat terpapar di URL callback dianggap kedaluwarsa
  setelah logout semua sesi. Tidak ada secret yang di-commit.
- `.env.local` diabaikan git (`.gitignore`: `.env`, `.env.*` kecuali `.env.example`).

## Status
Phase 1 selesai dan ter-deploy. Siap lanjut Phase 2.

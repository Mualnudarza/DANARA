# Danara

Mini web manajemen keuangan personal. Danara membagi pemasukan ke dompet berdasarkan alokasi, menghitung saldo akumulatif, mencatat pengeluaran, serta memindahkan dana antar-dompet. Google Sheets menyimpan data Anda.

## Jalankan lokal

```powershell
npm install
npm run dev
```

```powershell
npm test
npm run build
```

## Google Sheets OAuth

Danara berjalan sepenuhnya di browser. OAuth Client ID bersifat publik, tetapi jangan masukkan client secret ke proyek atau GitHub Pages.

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat project lalu aktifkan **Google Sheets API**.
3. Buka **APIs & Services → OAuth consent screen**. Pilih External atau Internal sesuai akun. Tambahkan akun Google Anda sebagai test user bila aplikasi masih Testing.
4. Buka **Credentials → Create credentials → OAuth client ID → Web application**.
5. Tambahkan JavaScript origin:
   - `http://localhost:5173`
   - `https://mualnudarza.github.io`
6. Salin Client ID yang berakhir dengan `.apps.googleusercontent.com`.
7. Jalankan Danara. Buka **Pengaturan alokasi**, tempel Client ID, tekan **Hubungkan Google**, lalu tekan **Buat spreadsheet baru**.
8. Setelah spreadsheet dibuat, simpan transaksi. Danara membuat tab `SETTING`, `DOMPET`, `TRANSAKSI`, `ALOKASI`, dan `TRANSFER`.

Google menampilkan layar persetujuan saat aplikasi meminta scope `spreadsheets`. Danara memakai scope ini untuk membaca dan menulis spreadsheet yang Anda pilih. Hindari memakai spreadsheet yang dibagikan ke publik.

## Struktur data

- `SETTING`: tipe pemasukan dan alokasi JSON per dompet.
- `DOMPET`: nama dompet, rekening atau e-wallet, warna.
- `TRANSAKSI`: sumber kebenaran saldo. Saldo dihitung dari semua entri ledger.
- `ALOKASI`: audit pemasukan yang dibagi otomatis.
- `TRANSFER`: audit perpindahan dompet. Setiap transfer membentuk dua entri ledger dengan group ID sama.

Perubahan alokasi hanya dipakai pemasukan baru. Riwayat tetap memakai nilai yang sudah ditulis pada ledger.

## Deploy GitHub Pages

```powershell
cd "E:\WORKSPACE\PROJECT\WEB-APPS\DANARA"
git init
git add .
git commit -m "Initial Danara app"
git remote add origin https://github.com/Mualnudarza/DANARA.git
git branch -M main
git push -u origin main
```

Di GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Workflow `.github/workflows/deploy.yml` membangun aplikasi dan publish ke `https://mualnudarza.github.io/DANARA/`.

Gunakan `npm ci` setelah lockfile tersedia. GitHub Actions memerlukan `package-lock.json`.

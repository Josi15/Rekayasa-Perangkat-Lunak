# Tahap 4 — Deploy Railway, satu service (laporan)

## Status pembuktian (jujur)
| Bagian | Status |
|---|---|
| `php -l` untuk `BuatAdmin.php` dan tesnya | **TERUJI** |
| Dockerfile, Caddyfile, start.sh, railway.toml | **BELUM TERUJI**: tidak ada Docker daemon, Packagist/Docker Hub tidak terjangkau. Belum pernah dibuild/dijalankan. Perkirakan perlu 1–2 iterasi perbaikan pada build pertama; kirim log-nya. |
| `simba:buat-admin` + `BuatAdminTest` | **BELUM DIJALANKAN** (butuh Laravel + PostgreSQL) |
| Variabel Railway | Disusun dari kode (`CekProduksi`, `.env.production.example`, `bootstrap/app.php`); belum divalidasi di Railway |
| `TRUSTED_PROXIES=100.64.0.0/10` | **TIDAK TERJAMIN**. Staf Railway hanya menyebut itu sebagai alamat peer yang teramati dan menyatakan IP bisa berubah ([forum Railway](https://station.railway.com/questions/supported-proxy-trust-configuration-for-198549e9), [forum Railway](https://station.railway.com/questions/authoritative-edge-ingress-proxy-source-4547cc81)). Edge Railway menimpa `X-Forwarded-*`/`X-Real-IP`. Pantau; bila IP klien di log/rate-limit tampak sebagai `100.64.x.x`, rentang perlu disesuaikan. |

## File baru / diubah
- `Dockerfile` (3 tahap logis: Node build → PHP 8.4 FrankenPHP + `pdo_pgsql` + overlay via `apply.sh` → salin `dist/` ke `public/`)
- `docker/Caddyfile` (docroot `public/`, dotfile/`artisan`/`.env`/`.log` → 404, aset ber-hash cache panjang, body maks 30 MB, port dari `$PORT`)
- `docker/php.ini` (upload 25M, post 30M, opcache, `expose_php=Off`)
- `docker/start.sh` (cek env wajib → tunggu DB & `migrate --force` (retry 12×5 dtk) → `config:cache` → `route:cache` → `simba:cek-produksi` (hanya info di log) → `frankenphp run`)
- `railway.toml` (builder Dockerfile, healthcheck `/up`), `.dockerignore`, `railway.env.example`
- `backend-laravel-foundation/deploy-layer/` (`simba:buat-admin`, `BuatAdminTest`); `apply.sh` +1 baris
- Frontend/halaman: tidak diubah.

Catatan desain: image merakit Laravel dari overlay saat build (`composer create-project ^12.0`), jadi versi minor Laravel bisa berubah antar build (tidak ada `composer.lock` di repo). Untuk build yang reproduktif: jalankan `apply.sh` lokal sekali, commit `composer.lock`-nya, dan sesuaikan Dockerfile.
Web server: FrankenPHP (Caddy + PHP dalam satu proses) berjalan sebagai root agar volume Railway bisa ditulis.

## Langkah deploy
1. Push repo ini (Dockerfile di root) ke GitHub. Railway → New Project → Deploy from GitHub repo. Tambah **PostgreSQL** (New → Database → PostgreSQL) di project yang sama.
2. Service app → Settings → Networking → **Generate Domain** (butuh dulu agar `RAILWAY_PUBLIC_DOMAIN` ada).
3. Service app → **Variables** → Raw Editor: tempel isi `railway.env.example`, isi semua `<ISI>`. `APP_KEY` dibuat di lokal: `php artisan key:generate --show`. Jangan isi `SESSION_DOMAIN`. Jangan isi `SEED_DEFAULT_PASSWORD`.
4. **Volume**: service app → Settings/Volumes → New Volume, mount path **`/app/storage/app/private`**. Satu volume = satu replika (jangan scale horizontal). Cadangkan volume dan database secara berkala (backup Railway + `pg_dump`).
5. Deploy. Log harus menampilkan migrate sukses lalu Caddy mendengar di `$PORT`; healthcheck `/up` hijau.
6. Domain kustom (opsional): ganti `APP_URL`, `SANCTUM_STATEFUL_DOMAINS` (host tanpa skema), `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`.

## Admin pertama (terkontrol, tanpa seed demo)
Di shell service (Railway CLI: `railway ssh`, atau tab Shell bila ada):
```bash
php artisan simba:buat-admin --username=admin.sekolah --email=admin@sekolah.id
# prompt password tersembunyi (min. 12 karakter, diminta dua kali)
```
Alternatif tanpa TTY: set variabel sementara `ADMIN_PASSWORD`, jalankan perintah tanpa prompt, lalu **hapus** variabel itu dan redeploy. Perintah menolak bila sudah ada admin (kecuali `--tambahan`), tidak mencetak password. **Jangan** `db:seed`.

## Verifikasi setelah deploy
1. `php artisan simba:cek-produksi` di shell service → semua `[OK]`. Item `[GAGAL]` wajib diperbaiki; `[SARAN]` boleh. Catatan: user DB Railway adalah superuser (cek hanya mengingatkan di teks), dan `QUEUE_CONNECTION=sync` akan muncul sebagai SARAN.
2. `curl -i https://<domain>/up` → 200; `curl -s https://<domain>/api/v1/health/ready` → `database: ok`.
3. Buka `https://<domain>/` → halaman login. Login admin → masuk, peran terbaca dari `/auth/me`. Logout → kembali ke login.
4. Cek cookie: `curl -si https://<domain>/sanctum/csrf-cookie | grep -i set-cookie` → ada `secure` dan `samesite=lax`.
5. Refresh (F5) di `https://<domain>/admin/users` → tetap halaman React.
6. Buat guru + kelas + mapel, unggah materi lewat UI, unduh lagi (isi sama). Lalu `curl -i https://<domain>/storage/app/private/materi/<nama>` dan `https://<domain>/materi/<nama>` → bukan 200/bukan isi berkas.
7. Redeploy (restart) → berkas materi tadi masih bisa diunduh (bukti volume persisten).
8. Reset password: pastikan email sampai (SMTP nyata).
9. Rate limit/IP: coba 6× login salah dari satu jaringan → 429. Dari jaringan lain tidak ikut terblokir (bukti IP klien terbaca, bukan IP proxy).

## Masalah tersisa
- Semua di atas belum dijalankan; build Docker pertama adalah ujian sebenarnya.
- 12 tes backend Tahap 1 (`bug.md`) dan integrasi frontend↔backend sungguhan masih belum teruji.
- Tidak ada worker antrean (sync). Tidak ada log audit login. Backup/restore belum diuji.

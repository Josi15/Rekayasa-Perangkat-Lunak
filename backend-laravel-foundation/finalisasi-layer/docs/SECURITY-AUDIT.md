# Audit Keamanan Backend LMS Simba (Backend 10)

Metode: **tinjauan kode statis + pemeriksaan skrip** (inventaris 94 rute, `php -l`, pengecekan otorisasi per rute, pengecekan SQL di PostgreSQL sementara). **Tidak ada pengujian dinamis lewat Laravel** karena Packagist tidak terjangkau dari lingkungan kerja. Ini bukan audit keamanan independen/penetration test, dan tidak menyatakan sistem aman atau siap produksi.

| Area | Temuan / mekanisme | Status |
|---|---|---|
| Otorisasi peran & kepemilikan | 94 endpoint: semua di bawah `auth:sanctum` + `akun.aktif`; otorisasi via `role:` atau Policy/`authorize()`. Skrip audit hanya menandai `/rekap/presensi` (sengaja: difilter per peran di query). FormRequest `authorize()` agar 403 mendahului 422. | Diperiksa statis |
| Validasi input | FormRequest per aksi; FK divalidasi `exists`; enum divalidasi; panjang dibatasi | Diperiksa statis |
| Rate limiting | `api` 60/mnt per pengguna/IP; `auth` 30/mnt/IP; `password-reset`; `LoginThrottle` 5 gagal/300 dtk | Konfigurasi ada, belum diuji dinamis |
| Hash password | Hash bcrypt via cast `hashed` Laravel; `BCRYPT_ROUNDS=12`; password tidak masuk Resource/`$hidden` | Diperiksa statis |
| Sesi & CSRF | Cookie sesi SPA Sanctum, `SESSION_ENCRYPT=true`, same-site lax, secure cookie wajib di produksi (`pastikanSesiAmanDiProduksi`). CSRF via `X-XSRF-TOKEN` | CSRF **belum diuji** (feature test melewati CSRF); uji manual curl |
| CORS | Dari env, daftar origin eksplisit, credentials hanya bila diizinkan | Diperiksa statis |
| Mass assignment | `$fillable` eksplisit; field peran/status/id tidak dipercaya dari klien; test disiapkan | Test belum dijalankan |
| SQL injection | Eloquent/query builder berparameter; tidak ada `DB::raw` dengan input pengguna (ditinjau); filter/sort lewat daftar putih | Diperiksa statis |
| Upload | Ekstensi/MIME/ukuran dibatasi (config `materi`, `tugas`), nama file acak, disk privat, unduh via otorisasi, header aman | Diperiksa statis |
| Kebocoran data | Resource eksplisit; NIP guru hanya untuk admin (diperbaiki di Backend 10); password/remember_token tidak pernah diserialisasi; login/reset password respons generik | Diperiksa statis |
| Kredensial di kode | Tidak ada; `.env.example` kosong; `.env` tidak di-commit; seed password dari env/acak | Diperiksa |
| Error response | Format seragam; 5xx generik tanpa stack trace; `request_id` | Diperiksa statis |
| Proxy | `TRUSTED_PROXIES` ditambahkan (Backend 10) agar IP rate limit & HTTPS benar di balik proxy | Baru, belum diuji |

## Perbaikan pada Backend 10
1. `JadwalResource`: `nip` guru hanya tampil untuk admin.
2. `bootstrap/app.php`: dukungan `TRUSTED_PROXIES`.
3. Command `simba:cek-produksi` + `.env.production.example`.
4. Test tambahan `tests/Feature/Final/*` (guard rute, input berbahaya, FK, alur utama, cek produksi).

## Risiko tersisa
- 403 vs 404 pada resource yang ada tapi bukan milik pengguna bisa membuka informasi keberadaan ID (bobot rendah; ID berurutan).
- Tidak ada log audit login/aksi sensitif.
- Lokasi presensi dapat dipalsukan klien (GPS spoofing); validasi hanya jarak/waktu.
- `composer audit` belum dijalankan (offline).
- Seluruh test belum dieksekusi; CSRF, rate limit, upload belum terbukti secara dinamis.

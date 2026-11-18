# Autentikasi & Role — LMS Simba (Backend 3)

## 1. Strategi
**Laravel Sanctum mode SPA (stateful): cookie sesi + CSRF.** Tidak ada token yang diterbitkan ke klien,
sehingga tidak ada token yang bisa bocor lewat JavaScript. Cookie sesi `HttpOnly`, `SameSite=lax`,
terenkripsi, dan `Secure` di produksi.

Alur klien: `GET /sanctum/csrf-cookie` → `POST /api/v1/auth/login` dengan header `X-XSRF-TOKEN`
(nilai cookie `XSRF-TOKEN`) dan `credentials: 'include'`. Sanctum hanya menyalakan sesi + CSRF untuk
request dengan `Origin`/`Referer` yang ada di `SANCTUM_STATEFUL_DOMAINS`; selain itu request dianggap
tanpa sesi dan login ditolak (`403 frontend_not_allowed`).

> SPA dan API harus satu *site* (mis. `localhost:5173` + `localhost:8000`, atau `app.contoh.id` +
> `api.contoh.id`). Beda site = cookie `SameSite=lax` tidak terkirim.

## 2. Endpoint (`/api/v1`)
| Metode & path | Akses | Hasil |
|---|---|---|
| `POST /auth/login` `{login, password}` | publik | 200 `{data: pengguna}` · 422 `invalid_credentials` · 429 `too_many_requests` · 403 `frontend_not_allowed` |
| `GET /auth/me` | login | 200 `{data: pengguna}` · 401 |
| `POST /auth/logout` | login | 204 · 401 |
| `POST /auth/forgot-password` `{email}` | publik | 200 pesan generik (sama untuk email ada/tidak) |
| `POST /auth/reset-password/validate` `{email, token}` | publik | 200 `{valid:true}` · 422 `invalid_reset_token` |
| `POST /auth/reset-password` `{email, token, password, password_confirmation}` | publik | 200 · 422 `invalid_reset_token` / `validation_error` |
| `GET /kelas`, `GET /kelas/{id}` | login (dibatasi Policy) | siswa: kelas yang diikuti; guru: wali/pengajar; admin: semua · 403 · 404 |
| `GET /admin/pengguna?peran=&page=&per_page=` | admin | 200 terpaginasi · 403 |

`login` boleh berisi **username, NISN, atau NIP**. Bila nilainya cocok dengan lebih dari satu akun
(mis. username seseorang = NISN orang lain), login **ditolak**. Kegagalan memakai pesan yang sama untuk
akun tidak ada maupun password salah. Field `peran` dari klien tidak pernah dibaca.

Format error: `{ "message", "code", "errors"?, "request_id" }`. 401 = belum login, 403 = peran/hak salah.

## 3. Role & otorisasi
- Peran (`siswa`, `guru`, `admin`) dibaca dari database lewat model `Pengguna` yang terautentikasi — **bukan dari input klien**.
- Middleware `role:admin` / `role:admin,guru` (`EnsureRole`) untuk pembatasan kasar per route; peran tak dikenal pada definisi route = error (gagal tertutup).
- Policy per model (`app/Policies`, ditemukan otomatis) untuk hak per baris. Ringkasan kebijakan:

| Sumber daya | Siswa | Guru | Admin |
|---|---|---|---|
| Kelas | lihat yang diikuti | lihat yang diwalikan / diajar | lihat & kelola semua |
| Mapel, Jadwal | lihat yang kelasnya terkait | lihat yang diampu | kelola |
| Materi, Tugas, Kuis | lihat (mapel kelasnya) | **kelola hanya mapel yang diampu** | lihat saja |
| Presensi | buat/lihat milik sendiri | lihat & koreksi pada jadwalnya | lihat, hapus |
| Pengumpulan tugas | buat/ubah/lihat milik sendiri | lihat pada tugas mapelnya | lihat, hapus |
| Nilai | lihat milik sendiri | **beri/ubah/hapus hanya pada mapel yang diampu** | lihat saja |
| Pengumuman | lihat global + mapelnya | buat/ubah pada mapel yang diampu | kelola semua (termasuk global) |
| Pengguna | lihat diri sendiri | lihat diri sendiri | kelola (tidak bisa hapus diri sendiri) |

> Admin **tidak** mengubah materi/tugas/kuis/nilai (wewenang guru pengampu). Ini asumsi kebijakan, mohon dikonfirmasi.

## 4. Konfigurasi keamanan
| Variabel | Fungsi |
|---|---|
| `SANCTUM_STATEFUL_DOMAINS` | host[:port] SPA yang boleh memakai cookie (tanpa skema) |
| `CORS_ALLOWED_ORIGINS`, `CORS_SUPPORTS_CREDENTIALS=true` | origin SPA eksplisit + credentials (tidak boleh `*`) |
| `SESSION_DRIVER=database`, `SESSION_LIFETIME`, `SESSION_ENCRYPT=true`, `SESSION_SAME_SITE=lax`, `SESSION_SECURE_COOKIE`, `SESSION_DOMAIN` | cookie sesi |
| `LOGIN_MAX_ATTEMPTS` (5), `LOGIN_DECAY_SECONDS` (300) | kunci login gagal per (login, IP) |
| `PASSWORD_RESET_EXPIRE_MINUTES` (60) | masa berlaku token reset |
| `FRONTEND_URL` | basis tautan reset di email |
| `MAIL_*` | pengiriman email (lokal: `log`) |

Perlindungan lain: limiter `auth` 30/menit/IP dan `password-reset` 5/menit/IP + 5/jam/email; password
minimal 10 karakter berhuruf besar-kecil dan angka (di produksi juga diperiksa kebocoran/`uncompromised`);
reset password mencabut semua sesi pengguna itu dan menggantikan `remember_token`; token reset disimpan
sebagai hash, sekali pakai, tidak pernah ada di respons API.

**Produksi:** aplikasi menolak melayani request (exception saat boot web) bila `SESSION_SECURE_COOKIE`
bukan `true`, `SESSION_ENCRYPT` bukan `true`, SameSite bukan lax/strict, atau `APP_DEBUG=true`.
Cek ini tidak berjalan di konsol agar `composer install`/`artisan` saat deploy tidak terblokir.

## 5. Menguji secara lokal
### 5.1 Persiapan
```bash
./apply.sh ~/Herd/lms-simba            # sekali; memasang Sanctum + semua layer
cd ~/Herd/lms-simba
# .env: isi DB_USERNAME/DB_PASSWORD, SEED_DEFAULT_PASSWORD=<password demo Anda>,
#       QUEUE_CONNECTION=sync   (email reset langsung diproses; atau jalankan: php artisan queue:work)
createdb lms_simba && createdb lms_simba_test
php artisan migrate --seed             # seeder hanya jalan pada DB kosong
php artisan serve                      # API di http://localhost:8000 (satu site dengan localhost:5173)
```
Akun demo (password = `SEED_DEFAULT_PASSWORD`; bila kosong, password acak dicetak sekali saat seeding):
admin `admin` / `admin@lms-simba.test`; guru: username/NIP acak (lihat `php artisan tinker` →
`App\Models\Pengguna::where('peran','guru')->first()`); siswa: login dengan NISN.

> Memakai domain Herd (`lms-simba.test`) juga bisa untuk uji curl (Origin tetap `localhost:5173`).
> Untuk SPA sungguhan, letakkan frontend di subdomain yang sama (mis. `app.lms-simba.test`),
> set `SESSION_DOMAIN=.lms-simba.test` dan `SANCTUM_STATEFUL_DOMAINS=app.lms-simba.test`.

### 5.2 Login, sesi, logout (`docs/uji-auth.sh`, perlu bash + curl + python3; di Windows pakai Git Bash/WSL atau Postman)
```bash
bash docs/uji-auth.sh login admin '<password demo>'   # 200 + data.peran = admin, cookie tersimpan
bash docs/uji-auth.sh me                              # 200 data pengguna (tanpa password)
bash docs/uji-auth.sh admin-pengguna                  # 200 (admin)
bash docs/uji-auth.sh logout                          # 204
bash docs/uji-auth.sh me                              # 401 unauthenticated
```
Coba juga: login salah (`422 invalid_credentials`), 6 kali salah beruntun (`429` + `Retry-After`),
login sebagai siswa lalu `admin-pengguna` (`403 forbidden`), `me` tanpa login (`401`), dan POST tanpa
`X-XSRF-TOKEN` (`419`).

Manual tanpa skrip: `curl -c jar -H "Origin: http://localhost:5173" -H "Referer: http://localhost:5173/" http://localhost:8000/sanctum/csrf-cookie`,
lalu kirim POST dengan `-b jar -c jar` dan `-H "X-XSRF-TOKEN: <nilai cookie XSRF-TOKEN, sudah di-URL-decode>"`.

### 5.3 Reset password
```bash
bash docs/uji-auth.sh lupa admin@lms-simba.test       # 200 pesan generik (juga untuk email yang tidak ada)
```
Ambil tautan reset dari email: dengan `MAIL_MAILER=log` buka `storage/logs/laravel-*.log` dan cari
`reset-password?token=` (teks email bisa terpotong/di-encode `=3D`; token = nilai setelah `token=`
hingga `&email`). Bila sulit dibaca, buat token langsung (hanya lokal):
```bash
php artisan tinker --execute="echo Illuminate\Support\Facades\Password::broker()->createToken(App\Models\Pengguna::where('email','admin@lms-simba.test')->first());"
bash docs/uji-auth.sh reset admin@lms-simba.test '<token>' 'PasswordBaru2026Aman'   # 200
bash docs/uji-auth.sh login admin 'PasswordBaru2026Aman'                          # 200
bash docs/uji-auth.sh reset admin@lms-simba.test '<token yang sama>' 'LainLagi2026Aman'   # 422 (sekali pakai)
```
Email sungguhan lokal: Mailpit/Herd Mail → `MAIL_MAILER=smtp`, `MAIL_HOST=127.0.0.1`, port sesuai aplikasi
(Mailpit 1025; Herd Mail 2525). Token kedaluwarsa setelah `PASSWORD_RESET_EXPIRE_MINUTES`.

### 5.4 Test otomatis
```bash
php artisan test tests/Feature/Auth     # login, logout/me, reset password, 401/403, policy, CSRF/CORS, sesi
php artisan test                        # seluruh suite (memakai database lms_simba_test)
```

## 6. Deviasi dari ERD & asumsi
1. **Kolom `pengguna.email` (nullable, unik tanpa membedakan huruf besar/kecil)** ditambahkan lewat migration terpisah, plus tabel `password_reset_tokens` — ERD tidak punya email, padahal reset lewat email mewajibkannya. Akun tanpa email tidak bisa reset sendiri (admin harus menggantinya). **Mohon konfirmasi.**
2. Tabel `personal_access_tokens` (bawaan Sanctum) ikut dibuat; saat ini tidak dipakai (tanpa token API). Model `Pengguna` belum memakai `HasApiTokens`; tambahkan bila nanti butuh token untuk klien non-browser.
3. Login gagal memakai **422** `invalid_credentials` (bukan 401); 401 dipakai untuk "belum login".
4. Matriks kebijakan akses di atas adalah asumsi saya dari deskripsi; akses baca pengguna oleh guru terhadap daftar siswa kelasnya belum ada.
5. Email reset mengantre (`ShouldQueue`) agar waktu respons tidak membocorkan keberadaan akun; butuh worker atau `sync`.

## 7. Status verifikasi
Kode ditulis dan ditinjau, tetapi **belum dijalankan lewat Laravel** (Composer/Packagist tidak terjangkau
di lingkungan penulisan). Yang sudah dicek: lint sintaks seluruh file PHP, referensi kelas lintas-layer,
SQL migration email/`password_reset_tokens` di PostgreSQL 16, dan mekanika `uji-auth.sh` terhadap server
tiruan. Yang belum: seluruh feature test dan perilaku Sanctum/CSRF/sesi sebenarnya — jalankan
`php artisan test` lebih dulu dan laporkan kegagalannya.

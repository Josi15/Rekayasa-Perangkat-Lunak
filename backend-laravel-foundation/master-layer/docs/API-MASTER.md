# API Data Utama — Pengguna, Kelas, Keanggotaan, Mata Pelajaran (Backend 4)

Semua endpoint di bawah `/api/v1`, memakai sesi Sanctum SPA (lihat `docs/AUTH.md`), dan membutuhkan
login **dan akun aktif** (akun yang dinonaktifkan mendapat 401 walau sesinya masih ada).
Format error: `{ "message", "code", "errors"?, "request_id" }`. Sukses: `{ "data": ... }`; daftar:
`{ "data", "links", "meta" }`.

## Parameter daftar (semua endpoint daftar)
`page`, `per_page` (1–100, bawaan 15), `cari` (maks 100 karakter; ILIKE, karakter `% _ \` diperlakukan
apa adanya), `status`, `urut` (whitelist per endpoint), `arah` (`asc`|`desc`). Nilai tidak valid = 422.

## Endpoint
| Metode & path | Akses | Catatan |
|---|---|---|
| `GET /profil` | semua peran | akun sendiri |
| `PATCH /profil` | semua peran | hanya `email`, `password` (+`password_confirmation`); wajib `password_saat_ini` bila mengubah email/password; ganti password mencabut sesi lain |
| `GET /admin/pengguna` | admin | `cari` (username/NISN/NIP/email), `peran`, `status`=aktif\|nonaktif\|semua (bawaan aktif), `urut`=id_pengguna\|username\|peran\|created_at |
| `POST /admin/pengguna` | admin | siswa: `nisn` wajib (10 digit); guru: `nip` wajib (18 digit); admin: `username` wajib; `email` opsional; `password` wajib |
| `GET /admin/pengguna/{id}` | admin | |
| `PATCH /admin/pengguna/{id}` | admin | `peran` dilarang (tak dapat diubah); NISN/NIP hanya sesuai peran akun; ganti password mencabut semua sesi akun itu |
| `POST /admin/pengguna/{id}/nonaktifkan` | admin | bukan akun sendiri (403); guru dengan wali kelas aktif / mapel aktif / jadwal mendatang → 409 |
| `POST /admin/pengguna/{id}/aktifkan` | admin | |
| `GET /kelas` | semua peran | dibatasi peran (siswa: kelas diikuti; guru: wali/pengajar; admin: semua); `status`=aktif\|diarsipkan\|semua; `id_wali` |
| `POST /kelas` | admin | `nama_kelas` (unik), `id_wali` (guru aktif) |
| `GET /kelas/{id}` | admin, guru terkait, siswa anggota | memuat `wali` (tanpa email/NIP) dan `jumlah_siswa` |
| `PATCH /kelas/{id}` | admin | hanya `nama_kelas`; kelas arsip → 409 |
| `PUT /kelas/{id}/wali` | admin | `id_wali` guru aktif |
| `POST /kelas/{id}/arsipkan`, `/pulihkan` | admin | arsip: 409 bila ada jadwal mendatang; pulihkan: 409 bila wali tidak aktif |
| `GET /kelas/{id}/anggota` | admin, guru terkait kelas | `cari`, `status` (akun; bawaan semua), `urut`=id_pengguna\|username\|nisn |
| `POST /kelas/{id}/anggota` `{id_siswa:[..]}` | admin, **wali kelas itu** | maks 100, siswa aktif; atomik; sudah anggota → 409 `already_member` |
| `DELETE /kelas/{id}/anggota/{siswa}` | admin, wali kelas itu | bukan anggota 404; kelas arsip 409; siswa yang sudah punya presensi di kelas itu hanya boleh dikeluarkan admin (wali: 409 `student_has_attendance`); presensi & nilai tidak dihapus |
| `GET /siswa/{id}/kelas` | admin, siswa itu sendiri, guru (irisan kelasnya) | target bukan siswa → 404 |
| `GET /mapel` | semua peran | admin: semua; guru: yang diampu; siswa: mapel pada jadwal kelasnya; `id_guru`, `status` |
| `POST /mapel` | admin | `nama_mapel`, `id_guru` (guru aktif); unik per (nama, guru) |
| `GET /mapel/{id}` | admin, guru pengampu, siswa yang kelasnya berjadwal mapel itu | |
| `PATCH /mapel/{id}` | admin | hanya `nama_mapel`; arsip → 409 |
| `PUT /mapel/{id}/guru` | admin | guru aktif; jadwal **mendatang** mapel ikut dialihkan, riwayat tidak; bentrok waktu guru baru → 409 `schedule_conflict` (semua dibatalkan) |
| `POST /mapel/{id}/arsipkan`, `/pulihkan` | admin | arsip: 409 bila ada jadwal mendatang; pulihkan: 409 bila guru tidak aktif |

Id di URL harus bilangan bulat (≤18 digit); selain itu 404. Hak akses diperiksa di `FormRequest::authorize()`
(sehingga 403 selalu mendahului 422) atau Policy.

## Kode 409 (`KonflikBisnisException`)
`already_member`, `class_archived`, `subject_archived`, `class_has_upcoming_schedule`,
`subject_has_upcoming_schedule`, `homeroom_teacher_inactive`, `teacher_inactive`,
`teacher_is_active_homeroom`, `teacher_has_active_subjects`, `teacher_has_upcoming_schedule`,
`student_has_attendance`, `schedule_conflict`.

## Deviasi dari ERD & asumsi (mohon dikonfirmasi)
1. **Kolom status ditambahkan** (ERD tidak punya): `pengguna.nonaktif_pada`, `kelas.diarsipkan_pada`,
   `mata_pelajaran.diarsipkan_pada` (timestamp nullable; NULL = aktif). Migration
   `2026_10_21_000001_add_status_columns_to_master_tables`. Data tidak pernah dihapus (FK RESTRICT).
2. ERD tidak punya kolom nama pengguna; API hanya menampilkan username/NISN/NIP. Disarankan menambah `nama_lengkap`.
3. Peran tidak dapat diubah setelah akun dibuat (buat akun baru bila perlu).
4. Wali kelas boleh menambah/mengeluarkan anggota kelasnya; siswa tidak boleh melihat daftar teman sekelas.
5. Hanya pasangan siswa-kelas yang unik; seorang siswa boleh mengikuti lebih dari satu kelas.
6. Guru yang dinonaktifkan harus lebih dulu dilepas dari wali kelas, mapel, dan jadwal mendatang.
7. Akun nonaktif tidak bisa login dan sesinya dicabut (bila `SESSION_DRIVER=database`).

## Menguji
```bash
php artisan migrate
php artisan test tests/Feature/Master      # atau: php artisan test
```

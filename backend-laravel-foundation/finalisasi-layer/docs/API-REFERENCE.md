# Referensi Endpoint LMS Simba

> Dibangkitkan dari kode oleh `verify/gen_openapi.py` (jumlah endpoint: 94). Spesifikasi lengkap: `openapi.yaml`.
> Basis URL `/api/v1`. Semua endpoint selain "publik" memerlukan sesi login + akun aktif. "role:admin" = dicek middleware; "login" = otorisasi per baris lewat policy (kolom Policy) dan/atau pembatasan data pada query.

## Autentikasi

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| POST | `/auth/forgot-password` | publik | - | 200 | Minta tautan reset password (respons selalu generik) | - | - |
| POST | `/auth/login` | publik | - | 200 | Login (NISN/NIP/username/email + password), memulai sesi | login, password | - |
| POST | `/auth/logout` | login | - | 204 | Logout, mengakhiri sesi | - | - |
| GET | `/auth/me` | login | - | 200 | Data pengguna yang sedang login | - | - |
| POST | `/auth/reset-password` | publik | - | 200 | Atur password baru dengan token reset | email, password, token | - |
| POST | `/auth/reset-password/validate` | publik | - | 200 | Periksa token reset masih berlaku | email, token | - |

## Dashboard

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/dashboard` | login | - | 200 | statistik sesuai peran pemanggil (peran dibaca dari database, bukan dari input klien). | dari, sampai | - |

## Health

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/health` | publik | - | 200 | liveness: aplikasi hidup (tanpa menyentuh database). | - | - |
| GET | `/health/ready` | publik | - | 200 | readiness: aplikasi siap melayani (database terjangkau). | - | - |

## Jadwal

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/guru/{guru}/jadwal` | login | viewJadwal | 200 | Jadwal mengajar seorang guru (admin atau guru itu) | - | - |
| GET | `/jadwal` | login | viewAny | 200 | jadwal yang boleh dilihat pemanggil (siswa: kelasnya; guru: yang diajar/diampu; admin: semua). | arah, cari, dari, id_guru, id_kelas, id_mapel, page, per_page, sampai, status, tanggal, urut | - |
| POST | `/jadwal` | login | create | 201 | Buat jadwal (admin); cek bentrok kelas/guru | id_guru, id_kelas, id_mapel, waktu_mulai, waktu_selesai | class_schedule_conflict, schedule_conflict, teacher_inactive, teacher_schedule_conflict |
| DELETE | `/jadwal/{jadwal}` | login | delete | 204 | hanya jadwal mendatang tanpa presensi. | - | schedule_has_attendance, schedule_started |
| GET | `/jadwal/{jadwal}` | login | view | 200 | Detail jadwal | - | - |
| PATCH | `/jadwal/{jadwal}` | login | update | 200 | Ubah jadwal mendatang tanpa presensi (admin) | id_guru, id_kelas, id_mapel, waktu_mulai, waktu_selesai | class_schedule_conflict, schedule_conflict, schedule_has_attendance, schedule_started, teacher_inactive, teacher_schedule_conflict |
| GET | `/siswa/{siswa}/jadwal` | login | viewJadwal | 200 | Jadwal seorang siswa (admin, siswa itu, atau guru terkait) | - | - |

## Kelas & keanggotaan

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/kelas` | login | viewAny | 200 | hanya kelas yang boleh dilihat peran pemanggil: siswa = kelas yang diikuti, guru = wali/pengajar, admin = semua. | arah, cari, id_wali, page, per_page, status, urut | - |
| POST | `/kelas` | login | create | 201 | (admin) | id_wali, nama_kelas | - |
| GET | `/kelas/{kelas}` | login | view | 200 | Detail kelas | - | - |
| PATCH | `/kelas/{kelas}` | login | update | 200 | (admin) — nama saja. | nama_kelas | - |
| GET | `/kelas/{kelas}/anggota` | login | viewAnggota | 200 | Daftar siswa anggota kelas | - | - |
| POST | `/kelas/{kelas}/anggota` | login | kelolaAnggota | 201 | {id_siswa:[..]} — atomik; 409 already_member bila ada yang sudah anggota. | id_siswa, id_siswa.* | already_member |
| DELETE | `/kelas/{kelas}/anggota/{siswa}` | login | kelolaAnggota | 204 | Keluarkan siswa dari kelas | - | - |
| POST | `/kelas/{kelas}/arsipkan` | login | arsipkan | 200 | (admin) — 409 bila masih ada jadwal mendatang. | - | - |
| POST | `/kelas/{kelas}/pulihkan` | login | pulihkan | 200 | (admin) | - | homeroom_teacher_inactive |
| PUT | `/kelas/{kelas}/wali` | login | gantiWali | 200 | (admin) | id_wali | - |
| GET | `/siswa/{siswa}/kelas` | login | viewAny, viewKelas | 200 | kelas yang diikuti seorang siswa. Admin: semua; siswa: miliknya; guru: hanya irisan dengan kelas yang diwalikan/diajarnya (KelasPolicy::scope). | arah, cari, id_wali, page, per_page, status, urut | - |

## Kuis

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/kuis` | login | viewAny | 200 | Daftar kuis yang boleh dilihat | arah, cari, page, per_page, status, urut | - |
| DELETE | `/kuis/{kuis}` | login | delete | 204 | hanya bila belum ada nilai (409 quiz_has_grades). | - | quiz_has_grades |
| GET | `/kuis/{kuis}` | login | view | 200 | Detail kuis (tautan Google Forms) | - | - |
| PATCH | `/kuis/{kuis}` | login | update | 200 | Ubah judul/tautan kuis (guru pengampu) | judul, tautan_google_form | - |
| GET | `/mapel/{mapel}/kuis` | login | view | 200 | Daftar kuis satu mapel | - | - |
| POST | `/mapel/{mapel}/kuis` | login | create | 201 | Buat kuis (guru pengampu); validasi tautan Google Forms | judul, tautan_google_form | - |

## Mata pelajaran

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/mapel` | login | viewAny | 200 | admin: semua; guru: yang diampu; siswa: mapel pada jadwal kelasnya. | arah, cari, id_guru, page, per_page, status, urut | - |
| POST | `/mapel` | login | create | 201 | (admin) | id_guru, nama_mapel | - |
| GET | `/mapel/{mapel}` | login | view | 200 | Detail mata pelajaran | - | - |
| PATCH | `/mapel/{mapel}` | login | update | 200 | (admin) — nama saja. | nama_mapel | - |
| POST | `/mapel/{mapel}/arsipkan` | login | arsipkan | 200 | (admin) | - | subject_has_upcoming_schedule |
| PUT | `/mapel/{mapel}/guru` | login | gantiGuru | 200 | (admin) — jadwal mendatang ikut dialihkan ke guru baru. | id_guru | schedule_conflict |
| POST | `/mapel/{mapel}/pulihkan` | login | pulihkan | 200 | (admin) | - | teacher_inactive |

## Materi

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/mapel/{mapel}/materi` | login | view | 200 | Daftar materi satu mapel | - | - |
| POST | `/mapel/{mapel}/materi` | login | create | 201 | Unggah materi (guru pengampu, multipart) | file, judul | - |
| DELETE | `/materi/{materi}` | login | delete | 204 | menghapus baris dan file. | - | - |
| GET | `/materi/{materi}` | login | view | 200 | Detail materi | - | - |
| PATCH | `/materi/{materi}` | login | update | 200 | Ubah judul materi (guru pengampu) | judul | - |
| GET | `/materi/{materi}/file` | login | view | 200 | unduh; izin sama dengan melihat materi. | - | - |
| POST | `/materi/{materi}/file` | login | update | 200 | mengganti file materi. | file | - |

## Nilai

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| POST | `/kuis/{kuis}/nilai` | login | beri | 201 | Catat nilai kuis seorang siswa (guru pengampu) | id_siswa, nilai, umpan_balik | grade_exists |
| GET | `/mapel/{mapel}/nilai` | login | lihatNilai | 200 | rekap per mapel (tugas + kuis), tanpa nilai akhir. | - | - |
| GET | `/nilai` | login | viewAny | 200 | dibatasi per peran. | arah, cari, id_kuis, id_mapel, id_siswa, id_tugas, page, per_page, status, sumber, urut | - |
| GET | `/nilai/saya` | role:siswa | viewAny | 200 | khusus siswa. | arah, cari, id_kuis, id_mapel, id_siswa, id_tugas, page, per_page, status, sumber, urut | - |
| GET | `/nilai/{nilai}` | login | view | 200 | Detail nilai | - | - |
| PATCH | `/nilai/{nilai}` | login | update | 200 | ubah nilai dan/atau umpan balik. | nilai, umpan_balik | - |
| POST | `/pengumpulan/{pengumpulan}/nilai` | login | beri | 201 | Beri nilai pengumpulan tugas (guru pengampu) | nilai, umpan_balik | grade_exists |
| GET | `/siswa/{siswa}/nilai` | login | viewNilai | 200 | guru hanya melihat nilai pada mapel yang diampunya. | - | - |

## Pengguna (admin)

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/admin/pengguna` | role:admin | viewAny | 200 | Daftar pengguna (admin) | arah, cari, page, per_page, peran, status, urut | - |
| POST | `/admin/pengguna` | role:admin | create | 201 | Buat pengguna (admin) | email, nip, nisn, password, peran, username | - |
| GET | `/admin/pengguna/{pengguna}` | role:admin | view | 200 | Detail pengguna (admin) | - | - |
| PATCH | `/admin/pengguna/{pengguna}` | role:admin | update | 200 | Ubah pengguna (admin) | email, nip, nisn, password, username | - |
| POST | `/admin/pengguna/{pengguna}/aktifkan` | role:admin | aktifkan | 200 | Aktifkan kembali akun pengguna | - | - |
| POST | `/admin/pengguna/{pengguna}/nonaktifkan` | role:admin | nonaktifkan | 200 | 409 bila guru masih punya tanggungan aktif. | - | teacher_has_active_subjects, teacher_has_upcoming_schedule, teacher_is_active_homeroom |

## Pengumpulan tugas

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/pengumpulan/saya` | role:siswa | - | 200 | seluruh pengumpulan milik siswa yang login. | - | - |
| GET | `/pengumpulan/{pengumpulan}` | login | view | 200 | admin, pemilik, guru pengampu; siswa lain 403. | - | - |
| GET | `/pengumpulan/{pengumpulan}/file` | login | view | 200 | Unduh jawaban (pemilik, guru pengampu, admin) | - | - |
| GET | `/tugas/{tugas}/pengumpulan` | login | lihatPengumpulan | 200 | daftar pengumpulan satu tugas (guru pengampu, admin). | - | - |
| POST | `/tugas/{tugas}/pengumpulan` | login | create | 201 | (siswa; multipart: file) | - | already_submitted, deadline_passed |
| POST | `/tugas/{tugas}/pengumpulan/revisi` | login | create | 200 | (siswa; multipart: file) | - | already_graded, deadline_passed |
| GET | `/tugas/{tugas}/pengumpulan/saya` | role:siswa | view | 200 | status pengumpulan milik sendiri pada satu tugas. | - | - |

## Pengumuman

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/mapel/{mapel}/pengumuman` | login | view | 200 | pengumuman cakupan mapel untuk satu mapel. | - | - |
| GET | `/pengumuman` | login | viewAny | 200 | hanya yang boleh dibaca pemanggil. | arah, cakupan, cari, id_mapel, page, per_page, status, urut | - |
| POST | `/pengumuman` | login | create | 201 | Buat pengumuman global (admin) atau mapel (guru pengampu/admin) | cakupan, id_mapel, isi, judul | - |
| DELETE | `/pengumuman/{pengumuman}` | login | delete | 204 | permanen (tidak ada kolom arsip pada ERD). | - | - |
| GET | `/pengumuman/{pengumuman}` | login | view | 200 | Detail pengumuman | - | - |
| PATCH | `/pengumuman/{pengumuman}` | login | update | 200 | judul/isi saja. | isi, judul | - |

## Presensi

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| POST | `/jadwal/{jadwal}/checkin` | role:siswa | create | 201 | siswa; hanya koordinat (opsional) yang dikirim. | lokasi_lat, lokasi_lng | attendance_exists, checkin_not_open, outside_radius |
| GET | `/jadwal/{jadwal}/presensi` | login | lihatPresensi | 200 | roster kelas + presensi sesi ini (termasuk yang belum tercatat). | arah, cari, page, per_page, status, status_kehadiran, urut | - |
| POST | `/jadwal/{jadwal}/presensi` | login | catatPresensi | 201 | pencatatan manual (izin/sakit/alpa/dll.) oleh guru pada jadwal / admin. | id_siswa, status_kehadiran | attendance_exists |
| GET | `/presensi` | login | viewAny | 200 | Daftar presensi yang boleh dilihat (dengan filter) | arah, cari, dari, id_jadwal, id_kelas, id_mapel, id_siswa, page, per_page, sampai, status, status_kehadiran, status_validasi_lokasi, urut | - |
| GET | `/presensi/saya` | role:siswa | viewAny | 200 | riwayat presensi milik sendiri (siswa). | arah, cari, dari, id_jadwal, id_kelas, id_mapel, id_siswa, page, per_page, sampai, status, status_kehadiran, status_validasi_lokasi, urut | - |
| GET | `/presensi/{presensi}` | login | view | 200 | Detail presensi | - | - |
| PATCH | `/presensi/{presensi}` | login | update | 200 | koreksi status_kehadiran (guru pada jadwal / admin). | status_kehadiran | - |
| GET | `/rekap/presensi` | login | - | 200 | hitungan kehadiran per siswa untuk periode (siswa: dirinya; guru: jadwalnya; admin: semua). | dari, id_guru, id_jadwal, id_kelas, id_mapel, id_siswa, page, per_page, sampai | - |

## Profil

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/profil` | login | - | 200 | Profil sendiri | - | - |
| PATCH | `/profil` | login | updateProfil | 200 | hanya email & password. | email, password, password_saat_ini | - |

## Tugas

| Metode | Path | Akses | Policy | Sukses | Ringkasan | Field input | Kode 409 |
|---|---|---|---|---|---|---|---|
| GET | `/mapel/{mapel}/tugas` | login | view | 200 | Daftar tugas satu mapel | - | - |
| POST | `/mapel/{mapel}/tugas` | login | create | 201 | Buat tugas (guru pengampu, multipart bila ada lampiran) | batas_waktu, instruksi, judul, lampiran | - |
| GET | `/tugas` | login | viewAny | 200 | tugas yang tersedia bagi pemanggil (dibatasi peran); status=terbuka untuk yang masih menerima. | arah, cari, id_mapel, page, per_page, status, urut | - |
| DELETE | `/tugas/{tugas}` | login | delete | 204 | hanya bila belum ada pengumpulan (409 task_has_submissions). | - | task_has_submissions |
| GET | `/tugas/{tugas}` | login | view | 200 | Detail tugas | - | - |
| PATCH | `/tugas/{tugas}` | login | update | 200 | Ubah tugas (guru pengampu) | batas_waktu, instruksi, judul | - |
| DELETE | `/tugas/{tugas}/lampiran` | login | update | 200 | Hapus lampiran tugas | - | - |
| GET | `/tugas/{tugas}/lampiran` | login | view | 200 | Unduh lampiran tugas | - | - |
| POST | `/tugas/{tugas}/lampiran` | login | update | 200 | (multipart: lampiran) | - | - |
| POST | `/tugas/{tugas}/tutup` | login | tutup | 200 | menghentikan pengumpulan sekarang (idempotent). | - | - |

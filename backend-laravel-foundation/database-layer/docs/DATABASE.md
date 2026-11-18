# Database LMS Simba (Backend 2)

Sumber struktur: definisi 12 tabel pada prompt Backend 2 (file ERD tidak terlampir). PostgreSQL saja
(migration memakai CHECK constraint mentah).

## Urutan migration (sesuai dependensi FK)
pengguna → kelas → mata_pelajaran → siswa_kelas → jadwal → presensi → materi → tugas →
pengumpulan_tugas → kuis → nilai → pengumuman. `0001_01_01_000000_create_users_table.php` bawaan
skeleton diganti: hanya `sessions` (tidak ada tabel `users`/`password_reset_tokens`).

## Deviasi / penambahan terhadap ERD, beserta alasan
| # | Perubahan | Alasan teknis |
|---|---|---|
| 1 | `created_at`, `updated_at` di semua tabel; `remember_token` di `pengguna` | Konvensi Eloquent; remember_token dibutuhkan autentikasi Laravel |
| 2 | `siswa_kelas`: PK komposit (id_siswa, id_kelas), tanpa id surrogate | ERD tidak punya PK; komposit sekaligus mencegah pasangan ganda |
| 3 | Nilai enum ditetapkan: status_kehadiran = hadir/terlambat/izin/sakit/alpa; status_validasi_lokasi = valid/tidak_valid/belum_divalidasi; status pengumpulan = dikumpulkan/terlambat/dinilai | ERD hanya menyebut nama kolom, bukan nilainya. **Asumsi, mohon dikonfirmasi** |
| 4 | Nullable tambahan: `presensi.waktu_checkin/lokasi_lat/lokasi_lng`, `tugas.lampiran`, `nilai.umpan_balik` | Izin/sakit/alpa tidak punya check-in & lokasi; lampiran dan umpan balik opsional |
| 5 | Unique tambahan: `kelas.nama_kelas`; `mata_pelajaran(nama_mapel,id_guru)`; `presensi(id_siswa,id_jadwal)`; `pengumpulan_tugas(id_siswa,id_tugas)`; `nilai.id_pengumpulan`, `nilai(id_siswa,id_kuis)`; `jadwal(id_kelas,waktu_mulai)`, `jadwal(id_guru,waktu_mulai)` | Mencegah data ganda / jadwal bentrok. Perlu ditinjau jika ada tahun ajaran (ERD tidak punya) |
| 6 | `nilai`: FK komposit (id_pengumpulan,id_siswa) → pengumpulan_tugas, didukung unique (id_pengumpulan,id_siswa) | Nilai tidak bisa menunjuk pengumpulan milik siswa lain |
| 7 | CHECK: `nilai` tepat satu sumber (XOR) & 0–100; `jadwal.waktu_selesai > waktu_mulai`; lat/lng valid & berpasangan; `pengumuman` global↔tanpa mapel, mapel↔wajib mapel; enum via CHECK | Integritas di level database (aturan E dan sejenisnya) |
| 8 | `ON DELETE RESTRICT` untuk semua FK, kecuali `siswa_kelas` (CASCADE) | Mencegah hilangnya data akademik tanpa sengaja |
| 9 | Waktu memakai `timestamptz` | Praktik PostgreSQL; aman lintas zona waktu |

## Belum ditegakkan (sengaja, perlu keputusan / Backend 3)
- Peran referensi (`kelas.id_wali`, `mata_pelajaran.id_guru` harus berperan guru; `siswa_kelas.id_siswa` berperan siswa): PostgreSQL tidak bisa memeriksa isi baris lain tanpa trigger. Ditegakkan di Form Request/Service nanti; seeder sudah mematuhinya.
- ERD tidak memiliki kolom nama pengguna. **Tidak ditambahkan** tanpa persetujuan, tetapi hampir pasti dibutuhkan UI (rekomendasi: `nama_lengkap`).
- `siswa wajib punya nisn`, `guru wajib punya nip` tidak dipaksa (ERD menyatakan nullable).
- `jadwal.id_guru` boleh berbeda dari guru mapel (mis. guru pengganti); tidak dipaksa sama.

## Keamanan
- `Pengguna`: password di-hash (cast `hashed`), `peran` tidak mass-assignable, password & remember_token disembunyikan.
- `PengumpulanTugas.status/waktu_kumpul` dan `Presensi.status_validasi_lokasi` tidak mass-assignable.
- Password akun demo dari `SEED_DEFAULT_PASSWORD` (.env); kosong → acak & ditampilkan sekali.

## Aturan nilai (E)
Dua lapis: model `Nilai` melempar `ValidationException` (jadi 422 lewat `ApiExceptionRenderer`) bila sumber
kosong, ganda, atau siswa bukan pemilik pengumpulan; database menolak yang sama lewat CHECK + FK komposit.

## Test & keamanan data
`phpunit.xml` memakai PostgreSQL database `lms_simba_test`. `DatabaseTestCase` menolak berjalan jika nama
database tidak berakhiran `_test`, karena `RefreshDatabase` menjalankan `migrate:fresh`. Seeder demo hanya
berjalan pada database yang tabel `pengguna`-nya kosong.
```bash
createdb lms_simba && createdb lms_simba_test
php artisan migrate         # database dev (non-destruktif)
php artisan db:seed         # hanya bila kosong
php artisan test
```

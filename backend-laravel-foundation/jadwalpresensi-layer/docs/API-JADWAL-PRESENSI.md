# API Jadwal dan Presensi (Backend 8)

Semua endpoint di bawah `/api/v1`, wajib login (Sanctum SPA, cookie + CSRF) dan akun aktif.
Format error: `{message, code, errors?, request_id}`. Daftar memakai pagination standar (`page`, `per_page`).

> **Status pengujian:** kode dan test ditulis, tetapi **belum dijalankan lewat Laravel** (Packagist tidak terjangkau dari sandbox).
> Yang sudah dicoba hanya sintaks PHP, perhitungan jarak haversine, serta query rekap dan constraint pada PostgreSQL sementara.
> Jalankan `php artisan test --filter=JadwalPresensi` setelah `apply.sh`.

## Keputusan desain (mohon ditinjau — nilai bawaan adalah ASUMSI, bukan aturan sekolah)

| Hal | Keputusan |
|---|---|
| Titik referensi & radius | `PRESENSI_LAT`, `PRESENSI_LNG`, `PRESENSI_RADIUS_METER` (bawaan 100 m). **Titik belum diisi** → check-in berkoordinat dijawab 503 `location_not_configured` sampai Anda mengisinya. |
| Lokasi wajib | `PRESENSI_LOKASI_WAJIB=true`: tanpa koordinat (izin lokasi ditolak) → 422. `false`: diterima dengan `belum_divalidasi`. |
| Di luar radius | `PRESENSI_LUAR_RADIUS=tolak` (409 `outside_radius`, tidak disimpan, boleh coba lagi) atau `tandai` (disimpan `tidak_valid` untuk ditinjau guru/admin). |
| Jendela check-in | Dibuka 15 menit sebelum mulai, ditutup saat selesai (`PRESENSI_BUKA_SEBELUM_MENIT`). |
| Hadir / terlambat | Check-in ≤ mulai + 10 menit = `hadir`; lebih = `terlambat` (`PRESENSI_TOLERANSI_MENIT`). |
| Presensi ganda | Satu catatan per (siswa, jadwal) — sesuai UNIQUE di ERD. Ulang = 409 `attendance_exists`. Koreksi lewat PATCH. |
| Status `alpa` | **Tidak otomatis.** Siswa yang tidak check-in tetap "belum tercatat" sampai guru/admin mencatat `alpa`. |
| Koreksi | Guru pengajar/pengampu **dan admin** boleh mengoreksi `status_kehadiran` (admin ditambahkan pada `PresensiPolicy::update`, sebelumnya hanya guru). Jejak check-in & lokasi tidak berubah. |
| Guru jadwal | `id_guru` bawaan = guru pengampu mapel; admin boleh menunjuk guru pengganti. Mengganti guru pengampu mapel (Backend 4) mengalihkan jadwal mendatang mapel itu. |
| Hapus/nonaktifkan jadwal | Tabel `jadwal` tidak punya kolom status → **tidak ada "nonaktif"**. Jadwal mendatang tanpa presensi dihapus permanen; yang sudah dimulai atau punya presensi terkunci (409). Kolom status butuh perubahan skema → belum dibuat tanpa persetujuan. |
| Bentrok | Tumpang tindih **interval** (bukan hanya mulai sama) untuk kelas dan guru → 409. Selesai = mulai berikutnya diperbolehkan. Tidak ada exclusion constraint di database (butuh `btree_gist`); pengamannya kunci baris + UNIQUE `(kelas, mulai)` dan `(guru, mulai)`. |
| Zona waktu | Input jadwal wajib ISO-8601 **dengan offset** (`2026-11-02T07:30:00+07:00` atau `Z`). Filter tanggal dihitung pada `PRESENSI_ZONA_WAKTU` (Asia/Jakarta). Respons berupa instan ISO-8601. |
| Sesi PostgreSQL | Dipaksa **UTC** (`ApiServiceProvider`, override `DB_TIMEZONE`). Tanpa ini, PostgreSQL yang berzona non-UTC (mis. di Windows) menggeser semua waktu `timestamptz` berjam-jam. Data uji lama yang ditulis saat zona salah tetap bergeser. |
| Rekap | Hitungan saja (tanpa persentase). Sesi yang dihitung: sudah dimulai dalam periode. Dasarnya keanggotaan kelas **saat ini** (`siswa_kelas` tidak menyimpan riwayat). |

## Peringatan keamanan: koordinat GPS dapat dipalsukan

Server menghitung jarak (haversine) dari koordinat yang **dikirim perangkat**. Koordinat itu tidak sepenuhnya dapat dipercaya:
aplikasi "mock location", emulator, perangkat ber-root, atau manipulasi permintaan dapat mengirim koordinat palsu.
Karena itu: (1) `status_validasi_lokasi`, `status_kehadiran`, `waktu_checkin`, dan `id_siswa` **tidak pernah diterima dari klien** (422);
(2) validasi lokasi hanya menyaring kecurangan yang mudah/tidak disengaja, **bukan bukti kehadiran fisik**;
(3) guru/admin dapat meninjau dan mengoreksi (`tandai` + PATCH); (4) log hanya menyimpan jarak, bukan koordinat.

## Jadwal

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/jadwal` | semua peran (dibatasi) | Siswa: kelasnya; guru: yang diajar/diampu; admin: semua. Filter: `tanggal=Y-m-d` (tidak bersama `dari`/`sampai`), `dari`, `sampai`, `id_kelas`, `id_guru`, `id_mapel`; `urut` (`waktu_mulai`,`id_jadwal`,`created_at`), `arah`. |
| GET | `/siswa/{siswa}/jadwal` | admin, siswa itu, guru | Guru hanya melihat irisan dengan jadwal yang berhak dilihatnya. 404 bila bukan siswa. |
| GET | `/guru/{guru}/jadwal` | admin, guru itu | 404 bila bukan guru. |
| GET | `/jadwal/{jadwal}` | admin, guru pengajar/pengampu, siswa kelas itu | Menyertakan `status` (`akan_datang`/`berlangsung`/`selesai`) dan `jumlah_presensi`. |
| POST | `/jadwal` | admin | `id_mapel`, `id_kelas`, `id_guru?`, `waktu_mulai` (masa depan), `waktu_selesai`. Durasi 10–480 menit. |
| PATCH | `/jadwal/{jadwal}` | admin | Salah satu field di atas; hanya jadwal mendatang tanpa presensi. |
| DELETE | `/jadwal/{jadwal}` | admin | 204; hanya jadwal mendatang tanpa presensi. |

Error khusus jadwal (409): `class_schedule_conflict`, `teacher_schedule_conflict`, `schedule_conflict`, `subject_archived`, `class_archived`,
`teacher_inactive`, `schedule_started`, `schedule_has_attendance`. Waktu/durasi tidak valid → 422.

## Presensi

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/jadwal/{jadwal}/checkin` | siswa kelas jadwal itu | Body hanya `lokasi_lat`, `lokasi_lng` (keduanya atau tidak sama sekali). 201. Respons menyertakan `jarak_meter` & `radius_meter` (tidak disimpan). |
| GET | `/presensi/saya` | siswa | Riwayat milik sendiri, terbaru dulu. |
| GET | `/presensi` | semua peran (dibatasi) | Siswa: miliknya; guru: jadwal yang diajar/diampu; admin: semua. Filter `dari`, `sampai`, `id_kelas`, `id_mapel`, `id_siswa`, `id_jadwal`, `status_kehadiran`, `status_validasi_lokasi`. |
| GET | `/presensi/{presensi}` | siswa pemilik, guru pada jadwal, admin | |
| GET | `/jadwal/{jadwal}/presensi` | admin, guru pada jadwal | Roster kelas + presensi sesi itu; filter `status_kehadiran` (termasuk `belum_tercatat`), `cari`. |
| POST | `/jadwal/{jadwal}/presensi` | admin, guru pada jadwal | Catat manual: `id_siswa`, `status_kehadiran`. Tanpa check-in/lokasi. `hadir`/`terlambat`/`alpa` hanya untuk sesi yang sudah dimulai (409 `schedule_not_started`). |
| PATCH | `/presensi/{presensi}` | admin, guru pada jadwal | Koreksi `status_kehadiran` saja. |
| GET | `/rekap/presensi` | semua peran (dibatasi) | `dari` & `sampai` wajib (maks 366 hari); filter `id_kelas`, `id_mapel`, `id_guru`, `id_siswa`, `id_jadwal`. Per siswa: `total_sesi`, `tercatat`, `belum_tercatat`, `hadir`, `terlambat`, `izin`, `sakit`, `alpa`. Siswa hanya melihat dirinya; guru jadwalnya; admin semua. |

Error khusus presensi: 409 `checkin_not_open`, `checkin_closed`, `outside_radius`, `attendance_exists`, `schedule_not_started`;
422 koordinat tidak valid / lokasi wajib; 503 `location_not_configured`; 403 bukan siswa kelas itu.

Contoh check-in dan respons:

```http
POST /api/v1/jadwal/12/checkin
{"lokasi_lat": -6.2001, "lokasi_lng": 106.8167}
```
```json
{"data":{"id_presensi":7,"id_siswa":3,"id_jadwal":12,"waktu_checkin":"2026-11-02T02:10:03.000000Z",
 "status_kehadiran":"hadir","status_validasi_lokasi":"valid","lokasi_lat":-6.2001,"lokasi_lng":106.8167,
 "jarak_meter":11.4,"radius_meter":100}}
```

## Pengamanan berlapis

Policy (`JadwalPolicy`, `PresensiPolicy`, `PenggunaPolicy::viewJadwal`) → FormRequest `authorize()` (403 sebelum 422) → service
(transaksi + kunci baris) → constraint PostgreSQL (CHECK `waktu_selesai > waktu_mulai`, CHECK rentang & pasangan koordinat,
UNIQUE `(siswa, jadwal)`, UNIQUE `(kelas, mulai)`, `(guru, mulai)`).

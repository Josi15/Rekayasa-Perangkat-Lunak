# API Pengumuman dan Dashboard (Backend 9)

Semua endpoint di bawah `/api/v1`, wajib login (Sanctum SPA, cookie + CSRF) dan akun aktif.
Format error: `{message, code, errors?, request_id}`. Daftar memakai pagination standar (`page`, `per_page`).

> **Status pengujian:** kode dan test ditulis, tetapi **belum dijalankan lewat Laravel** (Packagist tidak terjangkau dari sandbox).
> Jalankan `php artisan test --filter=PengumumanDashboard` setelah `apply.sh`.

## Keputusan desain (mohon ditinjau)

| Hal | Keputusan |
|---|---|
| Pengumuman global | Hanya **admin** yang dapat membuat/mengubah/menghapus (kebijakan publikasi = admin). Dibaca semua pengguna login. |
| Pengumuman mapel | Dibuat oleh admin atau guru **pengampu** mapel itu. Diubah/dihapus oleh admin, atau guru **penulisnya** selama masih mengampu mapel tersebut (`PengumumanPolicy` yang sudah ada; guru pengampu lain tidak ikut berwenang). |
| Pembaca | Siswa: global + mapel yang diikuti (kelasnya punya jadwal mapel itu). Guru: global + mapel yang diampu. Admin: semua. |
| Konsistensi | `global` ⇒ `id_mapel` kosong (dilarang di API); `mapel` ⇒ `id_mapel` wajib dan ada. Dijaga tiga lapis: FormRequest, service, CHECK `pengumuman_cakupan_mapel_check`. |
| Tidak dapat diubah | `cakupan`, `id_mapel`, `id_penulis`. Mengganti cakupan = hapus lalu buat baru. `id_penulis` selalu pengguna yang login. |
| Hapus/arsip | Tabel `pengumuman` tidak punya kolom arsip/status → **hapus permanen**. Arsip butuh kolom baru; belum dibuat tanpa persetujuan. |
| Mapel diarsipkan | Membuat/mengubah pengumuman mapel itu → 409 `subject_archived`; menghapus tetap boleh. |
| Isi | Teks polos (≤10.000 karakter). Klien harus menampilkannya sebagai teks, bukan HTML. |

## Pengumuman

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/pengumuman` | semua peran (dibatasi) | Filter `cakupan=global\|mapel`, `id_mapel`, `cari` (judul/isi), `urut` (`created_at`,`id_pengumuman`,`judul`), `arah` (bawaan terbaru dulu). Filter tidak dapat melebihi hak akses. |
| GET | `/mapel/{mapel}/pengumuman` | yang berhak melihat mapel | Hanya pengumuman cakupan mapel itu. |
| GET | `/pengumuman/{pengumuman}` | sesuai hak baca | 403 bila di luar hak. |
| POST | `/pengumuman` | admin (global); admin/guru pengampu (mapel) | Body `judul`, `isi`, `cakupan`, `id_mapel` (wajib bila `mapel`, dilarang bila `global`). 201. |
| PATCH | `/pengumuman/{pengumuman}` | admin / guru penulis pengampu | `judul` dan/atau `isi`. |
| DELETE | `/pengumuman/{pengumuman}` | admin / guru penulis pengampu | 204. |

## Dashboard

`GET /dashboard` — satu endpoint; isinya ditentukan **peran pemanggil yang dibaca server dari database**. Parameter seperti `?peran=admin`
diabaikan, sehingga siswa/guru tidak dapat meminta statistik admin. Opsional `dari` & `sampai` (`Y-m-d`) hanya untuk ringkasan presensi admin
(bawaan: 30 hari terakhir pada zona `PRESENSI_ZONA_WAKTU`). Semua angka dihitung langsung dari database setiap permintaan (tanpa cache/tabel ringkasan).
Daftar "terbaru/terdekat" dibatasi 5 baris.

### Sumber perhitungan

**Siswa** (data selalu dibatasi pada diri sendiri)

| Field | Sumber & definisi |
|---|---|
| `jumlah_kelas` | `siswa_kelas` milik siswa → `kelas` yang **tidak diarsipkan**. |
| `tugas_belum_dikumpulkan.total` | `tugas` pada mapel yang diikuti (kelas siswa punya `jadwal` mapel itu; `TugasPolicy::scope`) **tanpa** baris `pengumpulan_tugas` milik siswa. |
| `.masih_terbuka` / `.lewat_batas` | Dari total di atas: `batas_waktu` (+ toleransi `TUGAS_TOLERANSI_JAM`) belum / sudah lewat. |
| `.tenggat_terdekat` | Tugas terbuka yang belum dikumpulkan, urut `batas_waktu` terdekat. |
| `jadwal_terdekat` | `jadwal` kelas siswa dengan `waktu_selesai ≥ sekarang`, urut `waktu_mulai` (`JadwalPolicy::scope`). |
| `ringkasan_nilai` | Tabel `nilai` milik siswa: `jumlah_nilai`, `dari_tugas`, `dari_kuis`, `terendah`, `tertinggi`, `pengumpulan_menunggu_nilai` (pengumpulan siswa tanpa baris nilai), `terbaru`. **Tidak ada rata-rata/nilai akhir** — belum ada aturan akademik. |
| `pengumuman_terbaru` | `PengumumanPolicy::scope` (global + mapel yang diikuti), `created_at` terbaru. |

**Guru** (mapel yang diampu / jadwal yang diajar)

| Field | Sumber & definisi |
|---|---|
| `jumlah_kelas_diajar` | Kelas **aktif** yang punya `jadwal` guru itu (`id_guru`) atau jadwal mapel yang diampunya. |
| `jumlah_siswa` | Siswa **aktif** (`nonaktif_pada` kosong) pada kelas-kelas tersebut, dihitung **sekali** walau di beberapa kelas. |
| `tugas_perlu_dinilai` | `pengumpulan_tugas` pada tugas mapel yang diampu **tanpa** baris `nilai`. |
| `jadwal_mengajar` | Jadwal mendatang/berlangsung (`waktu_selesai ≥ sekarang`). |
| `ringkasan_pengumpulan` | `jumlah_tugas`, `tugas_masih_terbuka`, `total_pengumpulan`, `per_status` (`dikumpulkan`/`terlambat`/`dinilai` dari kolom `status`), dan `tugas_terbaru` (tugas dengan `batas_waktu` terbaru: `jumlah_pengumpulan`, `belum_dinilai`, `siswa_target` = siswa aktif di kelas aktif yang punya jadwal mapel itu). |
| `pengumuman_terbaru` | Global + mapel yang diampu. |

**Admin**

| Field | Sumber & definisi |
|---|---|
| `pengguna` | `pengguna` dikelompokkan `peran`: `total`, `aktif`, `nonaktif` (`nonaktif_pada`). |
| `kelas`, `mata_pelajaran` | `total`, `aktif`, `diarsipkan` (`diarsipkan_pada`). |
| `presensi` | Presensi pada jadwal yang `waktu_mulai`-nya dalam periode: `jumlah_sesi`, `total_presensi`, `per_status_kehadiran`, `per_status_lokasi`. |
| `aktivitas_sistem` | Hanya yang **tersedia**: jumlah baris baru 7 hari terakhir (`created_at`) untuk pengguna, pengumpulan, nilai, presensi, pengumuman, dan `created_at` terbaru tiap tabel. **Tidak tersedia:** log login dan audit perubahan (tidak disimpan di database); dilaporkan eksplisit pada `tidak_tersedia`. |

Semua field status selalu hadir (bernilai 0 bila kosong). Kolom `dihitung_pada` menandai waktu perhitungan.

## Notifikasi (usulan — belum dibuat)

ERD awal tidak punya tabel notifikasi, dan dashboard sudah menampilkan "pengumuman terbaru", "tugas perlu dinilai", dan "tenggat terdekat" langsung dari data,
jadi **tidak ada migration baru** pada Backend 9. Bila nanti notifikasi persisten (status dibaca/belum) dibutuhkan, usulan skema untuk disetujui dulu:

```
notifikasi: id_notifikasi (PK), id_pengguna (FK pengguna, RESTRICT, index), tipe (enum: pengumuman|tugas_baru|nilai|jadwal),
            judul (string 255), tautan (string 255, relatif ke API), dibaca_pada (timestamptz, nullable), created_at
            index (id_pengguna, dibaca_pada, created_at)
```

Endpoint yang menyertainya: `GET /notifikasi`, `POST /notifikasi/{id}/baca`, `POST /notifikasi/baca-semua`. Pembuatan baris lewat event pada service yang ada
(pengumuman dibuat, nilai diberikan, dst.), bukan oleh klien. Pertimbangan: volume baris (siswa × pengumuman global) dan kebijakan retensi.

## Pengamanan berlapis

Policy (`PengumumanPolicy` + `scope()`) → FormRequest `authorize()` (403 sebelum 422) → service (transaksi + kunci baris) → CHECK PostgreSQL.
Dashboard memakai scope policy yang sama dengan endpoint daftar masing-masing.

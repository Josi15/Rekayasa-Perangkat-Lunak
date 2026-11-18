# API Kuis dan Nilai (Backend 7)

Semua endpoint di bawah `/api/v1`, wajib login (Sanctum SPA, cookie + CSRF) dan akun aktif.
Format error: `{message, code, errors?, request_id}`. Daftar mengikuti pagination standar (`page`, `per_page`).

> **Status pengujian:** kode dan test ditulis, tetapi **belum dijalankan lewat Laravel** (Packagist tidak terjangkau dari sandbox).
> Jalankan `php artisan test --filter=KuisNilai` setelah `apply.sh`.

## Keputusan desain (mohon ditinjau)

| Hal | Keputusan |
|---|---|
| Kuis | Hanya `judul` + `tautan_google_form`. **Tidak ada** soal, jawaban, atau penilaian otomatis (sesuai ERD). |
| Hapus/arsip kuis | Tabel `kuis` tidak punya kolom status, jadi **hapus permanen**, hanya bila belum ada nilai (409 `quiz_has_grades`). Arsip butuh kolom baru → belum dibuat tanpa persetujuan. |
| Validasi tautan | https, host persis `docs.google.com` (`/forms/.../viewform`) atau `forms.gle/{kode}`. Tanpa permintaan jaringan: bentuk valid ≠ form benar-benar ada. |
| Skala nilai | **0–100, maks 2 desimal** (sama dengan CHECK `nilai_rentang_check`). Ubah skala = ubah migration + `AturanNilai`. |
| Sumber nilai | Tepat satu: pengumpulan tugas **atau** kuis (CHECK `nilai_sumber_tunggal_check`). |
| Nilai akhir | **Tidak ada** rumus/rata-rata. Belum ada aturan akademik; rekap hanya daftar nilai per item. |
| Status pengumpulan | Memberi nilai tugas mengubah `pengumpulan_tugas.status` → `dinilai` (transaksi sama) dan mengunci revisi siswa. Tidak ada endpoint hapus nilai, jadi tidak ada pembalikan status. |
| Admin | **Hanya baca** (rekap/detail). Tidak boleh memberi/mengubah nilai (selaras `NilaiPolicy`). |

## Kuis

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/kuis` | semua peran (dibatasi) | Siswa: mapel yang diikuti; guru: yang diampu; admin: semua. Filter `id_mapel`, `cari`, `urut` (`id_kuis`,`judul`,`created_at`), `arah`. |
| GET | `/mapel/{mapel}/kuis` | yang berhak melihat mapel | Daftar kuis satu mapel. |
| POST | `/mapel/{mapel}/kuis` | guru pengampu | Body `judul` (≤255), `tautan_google_form` (≤2048). 201. 409 `subject_archived` bila mapel diarsipkan. |
| GET | `/kuis/{kuis}` | admin, guru pengampu, siswa pengikut mapel | Menyertakan `jumlah_nilai`. |
| PATCH | `/kuis/{kuis}` | guru pengampu | `judul` dan/atau `tautan_google_form`; `id_mapel` ditolak. |
| DELETE | `/kuis/{kuis}` | guru pengampu | 204; 409 `quiz_has_grades` bila sudah ada nilai. |

## Nilai

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/pengumpulan/{pengumpulan}/nilai` | guru pengampu mapel tugas | Body `nilai`, `umpan_balik?`. `id_siswa` diturunkan dari pengumpulan (input klien ditolak). 201; 409 `grade_exists` bila sudah dinilai. |
| POST | `/kuis/{kuis}/nilai` | guru pengampu mapel kuis | Body `id_siswa`, `nilai`, `umpan_balik?`. Siswa harus aktif dan mengikuti mapel kuis (422 `id_siswa`). 409 `grade_exists` bila duplikat. |
| PATCH | `/nilai/{nilai}` | guru pengampu mapel sumber | `nilai` dan/atau `umpan_balik` (null menghapus umpan balik). Siswa/sumber tidak dapat diubah. |
| GET | `/nilai/{nilai}` | siswa pemilik, guru pengampu, admin | |
| GET | `/nilai/saya` | siswa | Nilai milik sendiri. |
| GET | `/nilai` | semua peran (dibatasi) | Siswa: miliknya; guru: mapel yang diampu; admin: semua. Filter `id_mapel`, `id_siswa`, `id_tugas`, `id_kuis`, `sumber=tugas\|kuis`; `urut` (`id_nilai`,`nilai`,`created_at`,`updated_at`). |
| GET | `/mapel/{mapel}/nilai` | guru pengampu, admin | Rekap nilai satu mapel (tugas + kuis). |
| GET | `/siswa/{siswa}/nilai` | admin, siswa itu, guru | Guru hanya melihat nilai pada mapel yang diampunya. 404 bila pengguna bukan siswa. |

Contoh respons nilai:

```json
{"data":{"id_nilai":5,"id_siswa":12,"sumber":"tugas","id_pengumpulan":8,"id_kuis":null,
 "rujukan":{"id_tugas":3,"judul":"Tugas 1","id_mapel":2},"nilai":87.5,"skala":{"min":0,"maks":100},
 "umpan_balik":"Bagus","created_at":"...","updated_at":"..."}}
```

## Kode error khusus

| Status | `code` | Penyebab |
|---|---|---|
| 409 | `grade_exists` | Pengumpulan/kuis-siswa itu sudah punya nilai (gunakan PATCH). |
| 409 | `quiz_has_grades` | Hapus kuis yang sudah bernilai. |
| 409 | `subject_archived` | Tambah/ubah kuis pada mapel yang diarsipkan. |
| 422 | — | Rentang/format nilai, tautan bukan Google Forms, siswa tidak mengikuti mapel, dll. |

## Pengamanan berlapis

Policy (`NilaiPolicy`, `KuisPolicy`) → FormRequest `authorize()` (403 sebelum 422) → service (transaksi + kunci baris) → model hook `Nilai::saving` → constraint PostgreSQL (CHECK sumber tunggal, CHECK 0–100, FK komposit `(id_pengumpulan,id_siswa)`, UNIQUE `id_pengumpulan` dan `(id_siswa,id_kuis)`).

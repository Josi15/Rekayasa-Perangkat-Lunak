# Laporan Pengujian — Backend 10

## Yang BENAR-BENAR dijalankan (di lingkungan kerja penulis)
| Pemeriksaan | Hasil |
|---|---|
| `php -l` pada seluruh file PHP semua layer (PHP 8.3.6) | Lulus tanpa error sintaks |
| Pemeriksaan tabrakan file antar-layer & referensi kelas/route→method antar-layer | Bersih |
| Audit otorisasi rute (`check_routes.py`) atas 94 endpoint | Hanya `/rekap/presensi` ditandai (disengaja) |
| Skema migration + aturan data diuji langsung di PostgreSQL 16 sementara (SQL) | Lulus pada pemeriksaan yang ditulis |
| Pemeriksaan aturan bisnis dalam PHP murni (tanpa Laravel) | Lulus |
| Validasi `openapi.yaml` (openapi-spec-validator) | Valid; 94 operasi, 65 path |

## TIDAK dijalankan
- **Seluruh PHPUnit/Feature test (Backend 2–10) belum pernah dieksekusi.** Packagist tidak terjangkau (HTTP 000) sehingga Laravel tidak dapat dipasang; tidak ada jalan pintas yang ditempuh.
- Tidak ada pengujian HTTP nyata, CSRF, rate limit, upload, unduh, `migrate` pada Laravel, maupun `simba:cek-produksi`.
- Test yang ditulis mencakup: login/logout, akses tanpa login, peran salah, CRUD sumber daya utama, validasi FK, pengumpulan & penilaian tugas, presensi, pengumuman, statistik dashboard, guard rute, input berbahaya.

## Cara menjalankan (di mesin Anda)
Buat DB `lms_simba_test`, lalu `php artisan test`. Test memakai DB terpisah dan menolak DB tanpa akhiran `_test`; tidak menyentuh `lms_simba`. Harap lapor hasil/kegagalan pertama untuk diperbaiki — kegagalan awal wajar karena kode belum pernah dieksekusi.

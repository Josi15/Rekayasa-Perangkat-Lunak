# Deployment LMS Simba Backend

**Herd bukan hosting produksi.** Herd hanya untuk pengembangan lokal. Dokumen ini daftar persyaratan; **belum ada yang divalidasi pada server produksi**, dan tidak ada klaim bahwa sistem aman/siap produksi.

## Wajib sebelum go-live
1. Salin `.env.production.example` → environment server; isi semua `<ISI>`. Jangan commit `.env`.
2. `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` dibuat di server.
3. HTTPS wajib: `SESSION_SECURE_COOKIE=true`, `APP_URL=https://...`. Di balik reverse proxy/load balancer atur `TRUSTED_PROXIES` ke IP proxy (bukan `*` kecuali jaringan privat tertutup) agar rate limiter dan deteksi HTTPS benar.
4. `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`: hanya domain frontend sebenarnya (tanpa wildcard).
5. Jalankan `php artisan simba:cek-produksi` — gagal (exit 1) bila konfigurasi wajib tidak terpenuhi. Lulus bukan bukti keamanan.
6. `composer install --no-dev --optimize-autoloader`, `php artisan config:cache route:cache`.
7. Akun admin: buat lewat cara terkontrol; **jangan** `db:seed` demo.

## Database (PostgreSQL)
- User aplikasi dengan hak minimum; koneksi privat/TLS bila lintas host.
- Backup terjadwal: `pg_dump -Fc -h <host> -U <user> lms_simba > lms_simba_$(date +%F).dump`; simpan terenkripsi di luar server, uji restore berkala (`pg_restore --create`). Backup yang belum pernah diuji restore dianggap belum ada.
- Migration produksi: `php artisan migrate --force` **hanya** setelah backup dan setelah isi migration ditinjau; tidak ada `migrate:fresh/rollback/db:wipe` tanpa persetujuan tertulis pemilik data.

## File & logging
- Berkas materi/tugas disimpan di disk privat (`storage/app/private`), tidak dapat diakses langsung lewat web; unduh melalui endpoint ber-otorisasi. Sertakan folder ini dalam backup dan pastikan web server tidak menyajikannya.
- `storage` dan `bootstrap/cache` writable oleh user PHP saja. Symlink publik tidak dipakai untuk berkas privat.
- Log harian `storage/logs` (`LOG_STACK=daily`, `LOG_LEVEL=warning` atau lebih tinggi); rotasi/pengiriman ke sistem log terpusat dan pemantauan menjadi tanggung jawab operator. Tiap respons error memuat `request_id` untuk melacak log.
- Tidak ada log audit login/aksi sensitif bawaan (lihat masalah tersisa).

## Proses lain
- Antrian/surel: `QUEUE_CONNECTION`/`MAIL_*` harus diatur agar reset password terkirim; uji pengiriman nyata.
- Jadwalkan `php artisan schedule:run` bila ada tugas terjadwal; jalankan worker queue di bawah supervisor.
- Perbarui dependensi dan jalankan `composer audit` secara berkala (belum pernah dijalankan; butuh internet).

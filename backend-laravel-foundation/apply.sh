#!/usr/bin/env bash
# Menerapkan fondasi LMS Simba ke proyek Laravel 12 baru.
# Pemakaian:  ./apply.sh /path/ke/lms-simba      (folder proyek belum ada atau kosong)
# STATUS: BELUM DIUJI end-to-end (lihat README bagian "Status verifikasi").
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:?Beri path tujuan proyek, mis. ~/Herd/lms-simba}"

if [ ! -f "$TARGET/artisan" ]; then
  composer create-project laravel/laravel "$TARGET" "^12.0" --no-interaction
fi

# Sanctum (Backend 3) dipasang SEBELUM file proyek disalin, supaya boot aplikasi saat
# composer menjalankan package:discover belum bergantung pada kode kita.
( cd "$TARGET" && { grep -q '"laravel/sanctum"' composer.json || composer require laravel/sanctum --no-interaction; } )

# Salin tanpa menimpa file yang berbeda diam-diam: file lama dicadangkan *.bak.
# Argumen ke-2 (opsional): awalan path yang DILEWATI.
copy_tree() {
  local from="$1" skip="${2:-}"
  (cd "$from" && find . -type f) | while read -r f; do
    if [ -n "$skip" ] && [[ "$f" == ./$skip* ]]; then continue; fi
    mkdir -p "$TARGET/$(dirname "$f")"
    if [ -f "$TARGET/$f" ] && ! cmp -s "$from/$f" "$TARGET/$f"; then
      cp "$TARGET/$f" "$TARGET/$f.bak"
    fi
    cp "$from/$f" "$TARGET/$f"
  done
}

copy_tree "$SRC/overlay"
# additions/database/migrations (set migration alternatif, bukan buatan Backend 2) DILEWATI:
# menyalinnya bersama database-layer membuat tabel yang sama dua kali.
copy_tree "$SRC/additions" "database/migrations"
copy_tree "$SRC/database-layer"   # Backend 2: migration, model, factory, seeder, test
copy_tree "$SRC/auth-layer"       # Backend 3: autentikasi, role, policy, reset password, test
copy_tree "$SRC/master-layer"     # Backend 4: API pengguna, kelas, mapel, keanggotaan, test
copy_tree "$SRC/materi-layer"     # Backend 5: API materi, penyimpanan file privat, test
copy_tree "$SRC/tugas-layer"       # Backend 6: API tugas & pengumpulan, file privat, test
copy_tree "$SRC/kuisnilai-layer"   # Backend 7: API kuis (tautan Google Forms) & nilai, test
copy_tree "$SRC/jadwalpresensi-layer" # Backend 8: API jadwal & presensi (validasi lokasi), test
copy_tree "$SRC/pengumumandashboard-layer" # Backend 9: API pengumuman & dashboard, test
copy_tree "$SRC/finalisasi-layer"  # Backend 10: audit, test akhir, cek produksi, dokumentasi final
copy_tree "$SRC/spa-layer"        # Tahap 3: Laravel menyajikan frontend React (route fallback, config/spa.php, tes). routes/web.php bawaan dicadangkan *.bak
copy_tree "$SRC/deploy-layer"     # Tahap 4: perintah simba:buat-admin (admin pertama terkontrol) + tes

cd "$TARGET"
[ -f .env ] || cp .env.example .env
[ -f config/sanctum.php ] || php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider" --no-interaction
# Migration token Sanctum hasil publish bernama berdasar waktu publish (berubah tiap build -> "tabel sudah ada").
# Diganti auth-layer/database/migrations/*_ensure_personal_access_tokens_table.php (nama tetap, idempoten).
find database/migrations -name '*_create_personal_access_tokens_table.php' -delete
php artisan key:generate --no-interaction
echo "Selesai. Isi DB_USERNAME/DB_PASSWORD di .env, buat DUA database kosong: lms_simba dan lms_simba_test.
Lalu: php artisan migrate && php artisan test   (test memakai lms_simba_test; db:seed hanya untuk DB kosong)
Panduan uji login & reset password: docs/AUTH.md"

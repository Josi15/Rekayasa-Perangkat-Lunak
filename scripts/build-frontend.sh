#!/usr/bin/env bash
# Build frontend React (mode API, satu origin) lalu salin ke public/ proyek Laravel.
# Pemakaian:  scripts/build-frontend.sh /path/ke/simba-backend
# - VITE_USE_MOCK=false dan VITE_API_BASE_URL=/api/v1 dipaksa di sini (bukan dari .env), tanpa rahasia.
# - Hanya menghapus public/assets (aset hash Vite lama) dan index.html; index.php/.htaccess/robots.txt tidak disentuh.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:?Beri path proyek Laravel (hasil apply.sh), mis. ../simba-backend}"
[ -f "$TARGET/artisan" ] || { echo "Bukan proyek Laravel: $TARGET (artisan tidak ada)" >&2; exit 1; }
FE="$ROOT/frontend-react-lms-simba"

cd "$FE"
[ -d node_modules ] || npm ci --no-audit --no-fund
VITE_USE_MOCK=false VITE_API_BASE_URL=/api/v1 npm run build

[ -f dist/index.html ] || { echo "dist/index.html tidak ada; build gagal" >&2; exit 1; }
# Tolak bila dist berisi nama yang akan menimpa berkas inti Laravel.
for n in index.php .htaccess web.config; do
  [ ! -e "dist/$n" ] || { echo "dist berisi $n; batal agar tidak menimpa public/$n" >&2; exit 1; }
done

rm -rf "$TARGET/public/assets" "$TARGET/public/index.html"
cp -R dist/. "$TARGET/public/"
echo "OK: frontend disalin ke $TARGET/public ($(find dist -type f | wc -l) berkas)."

#!/bin/sh
# Start command satu service: cek env wajib -> tunggu DB -> migrate --force -> config:cache -> route:cache -> web server.
set -eu
cd /app

for v in APP_KEY APP_URL DB_HOST DB_DATABASE DB_USERNAME DB_PASSWORD; do
  eval "val=\${$v:-}"
  [ -n "$val" ] || { echo "FATAL: variabel $v belum diisi (lihat docs/TAHAP-4.md)" >&2; exit 1; }
done

mkdir -p storage/app/private storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
# Volume Railway di-mount sebagai root; pastikan bisa ditulis.
chmod -R ug+rwX storage bootstrap/cache 2>/dev/null || true

# Tunggu PostgreSQL siap (maks ~60 dtk), lalu migrate. Gagal migrate = container berhenti (jangan melayani skema setengah jadi).
i=0
until php artisan migrate --force --no-interaction; do
  i=$((i+1))
  [ "$i" -lt 12 ] || { echo "FATAL: migrate gagal setelah $i percobaan" >&2; exit 1; }
  echo "migrate gagal; mencoba lagi dalam 5 dtk ($i/12)..." >&2
  sleep 5
done

# Data demo (opsional, HANYA untuk uji/demo): SEED_DEMO=true + SEED_DEFAULT_PASSWORD (password kuat) -> db:seed.
# Seeder sendiri dilewati bila tabel pengguna sudah berisi. Hapus SEED_DEMO setelah dipakai.
if [ "${SEED_DEMO:-}" = "true" ]; then
  if [ -n "${SEED_DEFAULT_PASSWORD:-}" ]; then
    php artisan db:seed --force --no-interaction || echo "PERINGATAN: db:seed gagal (lihat pesan di atas)" >&2
  else
    echo "PERINGATAN: SEED_DEMO=true diabaikan karena SEED_DEFAULT_PASSWORD kosong" >&2
  fi
fi

# Admin pertama (opsional): bila ketiga variabel diisi, buat admin. Menolak sendiri bila sudah ada admin.
if [ -n "${ADMIN_USERNAME:-}" ] && [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  php artisan simba:buat-admin --username="$ADMIN_USERNAME" --email="$ADMIN_EMAIL" --no-interaction \
    || echo "PERINGATAN: simba:buat-admin gagal/ditolak (lihat pesan di atas)" >&2
fi

php artisan config:cache --no-interaction
php artisan route:cache --no-interaction

# Hanya informasi di log (tidak menghentikan start); pemeriksaan resmi dijalankan manual setelah deploy.
php artisan simba:cek-produksi || echo "PERINGATAN: simba:cek-produksi melaporkan masalah (lihat di atas)" >&2

export PORT="${PORT:-8080}"
exec frankenphp run --config /etc/caddy/Caddyfile --adapter caddyfile

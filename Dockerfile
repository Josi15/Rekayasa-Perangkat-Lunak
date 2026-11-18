# syntax=docker/dockerfile:1
# SIMBA — SATU service untuk Railway: Laravel (API /api/v1) + hasil build React di public/.
# Build context = folder repo ini (berisi frontend-react-lms-simba/ dan backend-laravel-foundation/).
# STATUS: BELUM DIBUILD di lingkungan penyusun (tidak ada Docker daemon). Lihat docs/TAHAP-4.md.

# ---------- Stage 1: build frontend (mode API, satu origin) ----------
FROM node:22-alpine AS frontend
WORKDIR /fe
COPY frontend-react-lms-simba/package.json frontend-react-lms-simba/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend-react-lms-simba/ ./
# Nilai publik (bukan rahasia). Dipaksa di sini agar tidak bergantung pada .env mana pun.
ENV VITE_USE_MOCK=false VITE_API_BASE_URL=/api/v1
RUN npm run build && test -f dist/index.html

# ---------- Stage 2: Laravel 12 + overlay, PHP 8.4 + ekstensi pgsql, web server FrankenPHP (Caddy) ----------
FROM dunglas/frankenphp:1-php8.4 AS app
WORKDIR /app
ENV COMPOSER_ALLOW_SUPERUSER=1 COMPOSER_NO_INTERACTION=1

RUN install-php-extensions pdo_pgsql pgsql bcmath intl zip opcache pcntl \
 && apt-get update && apt-get install -y --no-install-recommends git unzip curl \
 && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Rakit proyek Laravel dari overlay (apply.sh membuat proyek baru lewat composer create-project).
COPY backend-laravel-foundation/ /overlay/
# /app dari image dasar tidak kosong (ada public/index.php contoh); composer create-project butuh folder kosong.
# Proyek dibuat dulu TANPA dev & TANPA script (agar bootstrap/cache tidak memuat paket dev seperti laravel/pail),
# lalu apply.sh (yang melihat artisan sudah ada, jadi hanya require sanctum + salin overlay).
RUN find /app -mindepth 1 -delete \
 && composer create-project laravel/laravel /app "^12.0" --no-dev --no-scripts --no-interaction \
 && chmod +x /overlay/apply.sh && /overlay/apply.sh /app \
 && rm -f /app/.env /app/.env.example.bak /app/database/database.sqlite \
 && rm -f /app/bootstrap/cache/*.php \
 && composer install --no-dev --optimize-autoloader --no-scripts \
 && (composer require fakerphp/faker --update-no-dev --no-scripts --no-interaction || echo 'PERINGATAN: faker tidak terpasang; SEED_DEMO tidak akan jalan') \
 && php artisan package:discover --ansi

# Hasil build frontend -> public/ (index.php, .htaccess, robots.txt tidak disentuh)
RUN rm -rf /app/public/assets /app/public/index.html
COPY --from=frontend /fe/dist/ /app/public/

COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-simba.ini
COPY docker/start.sh /usr/local/bin/simba-start
RUN chmod +x /usr/local/bin/simba-start \
 && mkdir -p storage/app/private storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
 && chmod -R ug+rwX storage bootstrap/cache

ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=stderr LOG_STACK=stderr XDG_CONFIG_HOME=/tmp XDG_DATA_HOME=/tmp
EXPOSE 8080
CMD ["simba-start"]

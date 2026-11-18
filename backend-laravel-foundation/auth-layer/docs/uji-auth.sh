#!/usr/bin/env bash
# Uji manual autentikasi SPA (Sanctum, cookie sesi + CSRF) dengan curl. HANYA untuk lokal.
# Meniru browser dari frontend terdaftar: kirim Origin/Referer, simpan cookie, kirim X-XSRF-TOKEN.
#
#   bash docs/uji-auth.sh login <login> <password>     # login = username / NISN / NIP
#   bash docs/uji-auth.sh me
#   bash docs/uji-auth.sh kelas
#   bash docs/uji-auth.sh admin-pengguna
#   bash docs/uji-auth.sh logout
#   bash docs/uji-auth.sh lupa <email>
#   bash docs/uji-auth.sh reset <email> <token> <password_baru>
#
# Variabel (opsional): API (default http://localhost:8000), ORIGIN (default http://localhost:5173),
# JAR (file cookie, default /tmp/simba-cookies.txt). ORIGIN harus ada di SANCTUM_STATEFUL_DOMAINS.
# Catatan: password di argumen terlihat di riwayat shell/daftar proses; jangan dipakai di server bersama.
set -euo pipefail

API="${API:-http://localhost:8000}"
ORIGIN="${ORIGIN:-http://localhost:5173}"
JAR="${JAR:-/tmp/simba-cookies.txt}"
HEADERS=(-H "Origin: $ORIGIN" -H "Referer: $ORIGIN/" -H "Accept: application/json")

# Nilai cookie XSRF-TOKEN terkini (di-URL-encode oleh Laravel; dikembalikan ke bentuk asli).
xsrf() {
  [ -f "$JAR" ] || { echo ""; return 0; }
  awk '$6=="XSRF-TOKEN"{v=$7} END{print v}' "$JAR" \
    | python3 -c 'import sys,urllib.parse;print(urllib.parse.unquote(sys.stdin.read().strip()))'
}

# Meminta cookie CSRF (juga membuat sesi). Wajib sebelum POST dari "frontend".
csrf() { curl -sS -o /dev/null -b "$JAR" -c "$JAR" "${HEADERS[@]}" "$API/sanctum/csrf-cookie"; }

get() { curl -sS -i -b "$JAR" -c "$JAR" "${HEADERS[@]}" "$API$1"; echo; }

post() { # $1 = path, $2 = JSON
  curl -sS -i -b "$JAR" -c "$JAR" "${HEADERS[@]}" \
    -H "Content-Type: application/json" -H "X-XSRF-TOKEN: $(xsrf)" \
    -X POST "$API$1" --data "$2"
  echo
}

# Membangun JSON dari pasangan kunci=nilai (aman terhadap tanda kutip di nilai).
json() { python3 -c 'import json,sys;print(json.dumps(dict(a.split("=",1) for a in sys.argv[1:])))' "$@"; }

[ "${BASH_SOURCE[0]}" = "$0" ] || return 0   # dimuat sebagai pustaka (mis. untuk pengujian)

perintah="${1:-}"; shift || true
case "$perintah" in
  login)           : "${1:?login}" "${2:?password}"; csrf; post /api/v1/auth/login "$(json login="$1" password="$2")" ;;
  me)              get /api/v1/auth/me ;;
  kelas)           get /api/v1/kelas ;;
  admin-pengguna)  get "/api/v1/admin/pengguna?per_page=5" ;;
  logout)          post /api/v1/auth/logout '{}' ;;
  lupa)            : "${1:?email}"; csrf; post /api/v1/auth/forgot-password "$(json email="$1")" ;;
  reset)           : "${1:?email}" "${2:?token}" "${3:?password_baru}"
                   csrf; post /api/v1/auth/reset-password "$(json email="$1" token="$2" password="$3" password_confirmation="$3")" ;;
  *) sed -n '2,15p' "$0"; exit 1 ;;
esac

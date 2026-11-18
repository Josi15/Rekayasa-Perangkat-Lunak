# Integrasi Frontend (React) — LMS Simba

Autentikasi: **Sanctum SPA (cookie sesi + CSRF)**, bukan token. Frontend dan API harus berada pada domain induk yang sama (mis. `app.sekolah.id` dan `api.sekolah.id`) atau origin yang terdaftar di `SANCTUM_STATEFUL_DOMAINS`.

## Alur login
```js
import axios from 'axios';
export const api = axios.create({ baseURL: 'https://api.sekolah.id/api/v1', withCredentials: true,
  withXSRFToken: true, xsrfCookieName: 'XSRF-TOKEN', xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { Accept: 'application/json' } });

await axios.get('https://api.sekolah.id/sanctum/csrf-cookie', { withCredentials: true });
await api.post('/auth/login', { login: 'admin', password: '...' });   // 200 + data pengguna
const me = await api.get('/auth/me');
await api.post('/auth/logout');                                       // 204
```
Selalu kirim `Accept: application/json` agar error berformat JSON.

## Format error
```json
{ "message": "...", "code": "validasi_gagal", "errors": { "field": ["..."] }, "request_id": "..." }
```
401 belum login/akun nonaktif · 403 peran/kepemilikan salah · 404 tidak ada · 409 konflik bisnis (`code` spesifik) · 422 validasi · 429 rate limit (header `Retry-After`) · 5xx pesan generik tanpa detail internal.

## Konvensi
- Daftar: paginasi Laravel (`data`, `links`, `meta`); filter lewat query string (lihat `API-REFERENCE.md`).
- Waktu: ISO-8601 dengan offset; simpan UTC, tampilkan zona lokal di UI.
- Enum (peran, status, cakupan, dll.) berupa string; jangan di-hardcode berbeda dari OpenAPI.
- Upload: `multipart/form-data` (materi, lampiran tugas, jawaban). Unduh lewat endpoint `.../file` / `.../lampiran` (butuh cookie sesi); gunakan `responseType: 'blob'`.
- Presensi check-in mengirim koordinat GPS; ini validasi jarak, **bukan** bukti anti-pemalsuan lokasi.
- Rate limit: 60/menit per pengguna/IP (`api`), 30/menit per IP untuk `/auth/*`, login dikunci setelah 5 kegagalan/300 dtk.

## Checklist kesiapan frontend
- [ ] `SANCTUM_STATEFUL_DOMAINS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, cookie domain sesuai domain frontend
- [ ] `withCredentials` aktif; `GET /sanctum/csrf-cookie` dipanggil sebelum login
- [ ] Penanganan 401 (redirect login), 403, 409 (tampilkan `code`), 422 (peta `errors`), 429
- [ ] Impor `openapi.yaml` ke generator tipe/klien (mis. openapi-typescript)
- [ ] UI per peran mengikuti ACCESS-MATRIX.md (backend tetap otoritas akhir)
- [ ] Uji manual alur CSRF dengan curl/browser (tidak tercakup feature test)
- [ ] Uji upload/unduh berkas besar & batas ukuran

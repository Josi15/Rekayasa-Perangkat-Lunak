import { env } from '../config/env'

// ---------------------------------------------------------------------------------------------
// 1) Transport MOCK (dipakai semua service saat ini). Data hidup di memori (lihat db.js).
//    Fase integrasi: ganti isi `resolver` tiap service dengan `apiRequest(...)` di bawah.
// ---------------------------------------------------------------------------------------------
export const delay = (ms = env.mockDelayMs) => new Promise((r) => setTimeout(r, ms))
export const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)))

export async function request(resolver) {
  await delay()
  return clone(await resolver())
}

// ---------------------------------------------------------------------------------------------
// 2) Transport API Laravel (dipakai saat VITE_USE_MOCK bukan "true").
//    Kontrak backend (lihat auth-layer/docs/AUTH.md): Sanctum mode SPA = cookie sesi + CSRF, TANPA token
//    di JavaScript. Sukses: { data, meta?, links? }. Error: { message, code, errors?, request_id }.
// ---------------------------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(message, { status = 0, code, errors, requestId, retryAfter } = {}) {
    super(message)
    this.name = 'ApiError'
    Object.assign(this, { status, code, errors, requestId, retryAfter })
  }
}

let csrfReady = false
export const resetCsrf = () => { csrfReady = false }

// Pemanggil (AuthContext) mendaftarkan handler untuk 401: sesi berakhir → kosongkan user → ProtectedRoute ke /login.
let unauthorizedHandler = null
export const onUnauthorized = (fn) => { unauthorizedHandler = fn; return () => { if (unauthorizedHandler === fn) unauthorizedHandler = null } }

const xsrfCookie = () => {
  if (typeof document === 'undefined') return ''
  const hit = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))
  return hit ? decodeURIComponent(hit.slice('XSRF-TOKEN='.length)) : ''
}

const qs = (query) => {
  const p = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && p.append(k, String(v)))
  const s = p.toString()
  return s ? `?${s}` : ''
}

const firstError = (errors) => Object.values(errors ?? {}).flat().find((m) => typeof m === 'string')

// Pesan untuk pengguna per kelas status (halaman cukup menampilkan error.message).
function messageFor(status, json, retryAfter) {
  const base = typeof json?.message === 'string' && json.message ? json.message : ''
  if (status === 422) { const first = firstError(json?.errors); return first && first !== base ? (base ? `${base} ${first}` : first) : base || 'Data tidak valid.' }
  if (status === 429) return `${base || 'Terlalu banyak permintaan.'}${retryAfter > 0 ? ` Coba lagi dalam ${retryAfter} detik.` : ' Coba lagi sebentar lagi.'}`
  if (status === 401) return base || 'Sesi berakhir. Silakan masuk kembali.'
  if (status === 403) return base || 'Anda tidak memiliki akses untuk tindakan ini.'
  if (status === 409) return base || 'Tindakan bertentangan dengan keadaan data saat ini.'
  if (status === 419) return 'Sesi keamanan kedaluwarsa. Muat ulang halaman lalu coba lagi.'
  if (status >= 500) return 'Terjadi kesalahan pada server. Coba lagi nanti.'
  return base || `Permintaan gagal (${status}).`
}

async function toApiError(res, json) {
  const retryAfter = Number(res.headers?.get?.('Retry-After')) || 0
  return new ApiError(messageFor(res.status, json, retryAfter), { status: res.status, code: json?.code, errors: json?.errors, requestId: json?.request_id, retryAfter })
}

async function send(path, { method = 'GET', body, query, signal, accept = 'application/json' } = {}) {
  const verb = method.toUpperCase()
  const unsafe = verb !== 'GET' && verb !== 'HEAD'
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const once = async () => {
    if (unsafe && !csrfReady) {
      await fetch(`${env.backendOrigin}/sanctum/csrf-cookie`, { credentials: 'include', headers: { Accept: 'application/json' } })
      csrfReady = true
    }
    const headers = { Accept: accept }
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
    if (unsafe) headers['X-XSRF-TOKEN'] = xsrfCookie()
    return fetch(`${env.apiBaseUrl}${path}${qs(query)}`, { method: verb, credentials: 'include', headers, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body), signal })
  }
  let res
  try {
    res = await once()
    if (res.status === 419) { csrfReady = false; res = await once() } // token CSRF kedaluwarsa: ambil ulang sekali
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi Anda.', { status: 0, code: 'network_error' })
  }
  return res
}

// opsi: { method, body (objek JSON atau FormData), query, signal, quiet401 }
// quiet401: jangan picu handler "sesi berakhir" (dipakai /auth/me saat memulihkan sesi dan login).
export async function apiRequest(path, opts = {}) {
  const res = await send(path, opts)
  if (res.status === 204) return null
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const err = await toApiError(res, json)
    if (res.status === 401 && !opts.quiet401) unauthorizedHandler?.(err)
    throw err
  }
  return json
}

// Semua halaman daftar: ikuti paginasi Laravel ({ data, meta.last_page }) hingga habis (maks. 50 halaman × 100 baris).
export async function fetchAll(path, query = {}) {
  const rows = []
  for (let page = 1; page <= 50; page++) {
    const r = await apiRequest(path, { query: { ...query, page, per_page: 100 } })
    rows.push(...(r?.data ?? []))
    const last = r?.meta?.last_page
    if (!last || page >= last) break
  }
  return rows
}

// Unduh berkas ber-otorisasi (cookie sesi). Mengembalikan { blob, filename }.
export async function apiDownload(path, fallbackName = 'berkas') {
  const res = await send(path, { accept: '*/*' })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    const err = await toApiError(res, json)
    if (res.status === 401) unauthorizedHandler?.(err)
    throw err
  }
  const cd = res.headers?.get?.('Content-Disposition') ?? ''
  const m = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd)
  return { blob: await res.blob(), filename: m ? decodeURIComponent(m[1] ?? m[2]) : fallbackName }
}

// Simpan Blob ke komputer pengguna (dipanggil dari aksi klik; tidak membuka URL API langsung).
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

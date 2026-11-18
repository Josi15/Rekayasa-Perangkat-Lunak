// Konfigurasi dari environment variable Vite (lihat .env.example). Hanya variabel berawalan VITE_ yang
// tersedia di klien, dan SEMUANYA publik: jangan menaruh rahasia di sini.
const raw = import.meta.env ?? {}

const trimSlash = (s) => String(s).replace(/\/+$/, '')

// Base URL API Laravel. Boleh absolut (http://localhost:8000/api/v1) atau relatif (/api/v1) bila memakai proxy.
export const apiBaseUrl = trimSlash(raw.VITE_API_BASE_URL || 'http://localhost:8000/api/v1')

// Origin backend untuk endpoint Sanctum /sanctum/csrf-cookie (kosong = origin yang sama).
export const backendOrigin = /^https?:\/\//.test(apiBaseUrl) ? new URL(apiBaseUrl).origin : ''

// Jeda simulasi jaringan pada data mock (ms).
const delay = Number(raw.VITE_MOCK_DELAY_MS)
export const mockDelayMs = Number.isFinite(delay) && delay >= 0 && raw.VITE_MOCK_DELAY_MS !== undefined && raw.VITE_MOCK_DELAY_MS !== '' ? delay : 300

// Mode data. VITE_USE_MOCK=true → seluruh service memakai data simulasi di memori (demo & vitest).
// Selain itu (default) → service memanggil API Laravel lewat apiRequest.
export const useMock = String(raw.VITE_USE_MOCK ?? '').trim().toLowerCase() === 'true'

export const env = { apiBaseUrl, backendOrigin, mockDelayMs, useMock }

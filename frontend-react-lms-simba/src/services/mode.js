import { useMock } from '../config/env'
import { ApiError } from './http'

// Mode data aktif: 'mock' (data simulasi di memori) atau 'api' (backend Laravel). Diatur oleh VITE_USE_MOCK.
export const serviceMode = { mock: useMock, live: !useMock, name: useMock ? 'mock' : 'api' }

// Pilih implementasi service berdasarkan mode. Kedua implementasi harus mengembalikan BENTUK DATA yang sama
// (bentuk yang dipakai halaman); perbedaan struktur backend ditangani lapisan adaptasi di services/api/.
export const pick = (mock, api) => (useMock ? mock : api)

// Fitur yang belum punya endpoint di backend: gagal dengan pesan jelas (jangan menampilkan data palsu seolah nyata).
export const unsupported = (fitur) => () => Promise.reject(new ApiError(`${fitur} belum didukung oleh backend.`, { status: 501, code: 'belum_didukung' }))

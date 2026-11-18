// Mode API pada tingkat UI: sesi dipulihkan dari /auth/me (bukan localStorage), 401 → halaman masuk, peran salah → 403.
// Service dipilih saat modul dimuat, jadi modul dimuat ulang dengan VITE_USE_MOCK=false. fetch = stub; tanpa jaringan.
import { afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const res = (status, body) => ({ status, ok: status >= 200 && status < 300, headers: { get: () => null }, json: async () => body })
const T = { timeout: 5000 }
let routes
const admin = { id_pengguna: 1, username: 'admin', email: 'a@x.id', peran: 'admin', aktif: true }
const guru = { id_pengguna: 2, username: 'bu.ratna', nip: '1'.repeat(18), peran: 'guru', aktif: true }
const list = (data) => res(200, { data, meta: { current_page: 1, last_page: 1 } })

async function mount(path) {
  vi.resetModules(); vi.stubEnv('VITE_USE_MOCK', 'false')
  const [{ default: App }, { AuthProvider }, { ToastProvider }] = await Promise.all([import('../routes'), import('../contexts/AuthContext'), import('../contexts/ToastContext')])
  return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></MemoryRouter>)
}
beforeEach(() => {
  routes = {}
  localStorage.clear()
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const p = String(url).replace(/^.*\/api\/v1/, '').split('?')[0]
    const key = `${(init.method ?? 'GET').toUpperCase()} ${p}`
    if (String(url).endsWith('/sanctum/csrf-cookie')) return res(204, null)
    return routes[key] ? routes[key]() : list([])
  })
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

test('sesi dipulihkan dari /auth/me: admin membuka /admin/users tanpa localStorage dan melihat data dari API', async () => {
  routes['GET /auth/me'] = () => res(200, { data: admin })
  routes['GET /admin/pengguna'] = () => list([admin, { id_pengguna: 5, nisn: '0012345678', email: 'siswa@x.id', peran: 'siswa', aktif: true }])
  await mount('/admin/users')
  expect(await screen.findByText('0012345678', {}, T)).toBeInTheDocument()
  expect(localStorage.length).toBe(0)
})

test('belum login (/auth/me 401) → halaman masuk', async () => {
  routes['GET /auth/me'] = () => res(401, { message: 'Unauthenticated.', code: 'unauthenticated' })
  await mount('/student/dashboard')
  expect(await screen.findByRole('heading', { name: 'Masuk' }, T)).toBeInTheDocument()
})

test('peran dari backend menentukan akses: guru ke /admin/users → Akses ditolak', async () => {
  routes['GET /auth/me'] = () => res(200, { data: guru })
  await mount('/admin/users')
  expect(await screen.findByText('Akses ditolak', {}, T)).toBeInTheDocument()
})

test('401 di tengah sesi → kembali ke halaman masuk', async () => {
  routes['GET /auth/me'] = () => res(200, { data: admin })
  routes['GET /admin/pengguna'] = () => res(401, { message: 'Unauthenticated.', code: 'unauthenticated' })
  await mount('/admin/users')
  expect(await screen.findByRole('heading', { name: 'Masuk' }, T)).toBeInTheDocument()
})

// Tes transport API Laravel (Sanctum SPA: cookie + CSRF). fetch diganti stub; tidak ada jaringan.
import { afterEach, beforeEach } from 'vitest'
import { apiRequest, ApiError, resetCsrf } from '../services/http'

const json = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body })
let calls
beforeEach(() => { calls = []; resetCsrf(); document.cookie = 'XSRF-TOKEN=abc%3D; path=/' })
afterEach(() => { vi.restoreAllMocks(); document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' })
const stub = (...responses) => { globalThis.fetch = vi.fn(async (url, init) => { calls.push({ url: String(url), init }); return responses.shift() ?? json(200, {}) }) }

test('GET: tanpa CSRF, membawa cookie, query dirangkai, bentuk { data } dikembalikan', async () => {
  stub(json(200, { data: [1], meta: { total: 1 } }))
  const r = await apiRequest('/kelas', { query: { page: 2, q: '', per_page: 10 } })
  expect(r.data).toEqual([1])
  expect(calls).toHaveLength(1)
  expect(calls[0].url.endsWith('/kelas?page=2&per_page=10')).toBe(true)
  expect(calls[0].init.credentials).toBe('include')
  expect(calls[0].init.headers['X-XSRF-TOKEN']).toBe(undefined)
})

test('POST: mengambil /sanctum/csrf-cookie sekali lalu mengirim X-XSRF-TOKEN', async () => {
  stub(json(204, null), json(200, { data: { id: 1 } }), json(200, { data: { id: 2 } }))
  await apiRequest('/auth/login', { method: 'POST', body: { login: 'x', password: 'y' } })
  await apiRequest('/kelas', { method: 'post', body: { name: 'a' } })
  expect(calls[0].url.endsWith('/sanctum/csrf-cookie')).toBe(true)
  expect(calls).toHaveLength(3) // csrf hanya sekali
  expect(calls[1].init.headers['X-XSRF-TOKEN']).toBe('abc=')
  expect(calls[1].init.headers['Content-Type']).toBe('application/json')
  expect(calls[1].init.body).toBe(JSON.stringify({ login: 'x', password: 'y' }))
})

test('error Laravel dipetakan ke ApiError (message, code, errors, request_id)', async () => {
  stub(json(422, { message: 'Data tidak valid.', code: 'validation_error', errors: { name: ['wajib'] }, request_id: 'r-1' }))
  const e = await apiRequest('/kelas').catch((x) => x)
  expect(e instanceof ApiError).toBe(true)
  expect(e.status).toBe(422)
  expect(e.code).toBe('validation_error')
  expect(e.errors.name[0]).toBe('wajib')
  expect(e.requestId).toBe('r-1')
})

test('419 (CSRF kedaluwarsa): token diambil ulang dan permintaan diulang sekali; 204 → null', async () => {
  stub(json(204, null), json(419, { message: 'CSRF token mismatch.' }), json(204, null), json(204, null))
  const r = await apiRequest('/auth/logout', { method: 'POST' })
  expect(r).toBeNull()
  expect(calls.map((c) => c.url.split('/').pop())).toEqual(['csrf-cookie', 'logout', 'csrf-cookie', 'logout'])
})

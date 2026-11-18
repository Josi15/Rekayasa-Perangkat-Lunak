import { request } from './http'
import { db, findUser, fail } from './db'
import { pick } from './mode'
import { authApi } from './api/authApi'

// Sesi SIMULASI di localStorage. Hanya menyimpan id + tampilan; peran & status SELALU dibaca ulang dari
// db saat sesi dipulihkan, jadi mengubah `role` di localStorage tidak memberi akses lintas peran.
// Catatan: ini tetap hanya UX demo. Otorisasi nyata WAJIB di backend (Sanctum + Policy).
export const SESSION_KEY = 'simba_mock_session'

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '')
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, username: u.username, role: u.role, status: u.status })
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null } }
const writeSession = (v) => localStorage.setItem(SESSION_KEY, JSON.stringify(v))

const mockAuthService = {
  // Identitas boleh username, email, NISN, atau NIP (selaras dengan backend: username/NISN/NIP).
  async login({ identifier, password }) {
    return request(() => {
      const id = norm(identifier)
      const u = id && db.users.find((x) => [x.username, x.email, x.nisn, x.nip].some((v) => v && norm(v) === id))
      if (!u || db.credentials[u.id] !== password) fail('Email/username atau kata sandi salah.')
      if (u.status === 'pending') fail('Akun belum diaktifkan. Hubungi administrator.')
      if (u.status !== 'active') fail('Akun tidak aktif. Hubungi administrator.')
      const safe = publicUser(u)
      writeSession(safe)
      return safe
    })
  },
  currentUser() {
    const s = readSession()
    if (!s) return null
    const u = findUser(s.id)
    if (!u || u.status !== 'active') { localStorage.removeItem(SESSION_KEY); return null }
    return { ...s, ...publicUser(u) }
  },
  updateSession(patch) {
    const next = { ...authService.currentUser(), ...patch }
    writeSession(next)
    return next
  },
  logout() { localStorage.removeItem(SESSION_KEY) },
  // Simulasi: tidak ada email terkirim. Respons sama untuk email terdaftar maupun tidak (anti-enumerasi).
  async requestPasswordReset() { return request(() => ({ simulated: true })) },
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const authService = pick(mockAuthService, authApi)

import { users } from '../data/mock.js'

const KEY = 'simba_session'
const SESSION_V = 2 // naikkan bila struktur data pengguna berubah; sesi lama otomatis dibuang
const PASSWORDS = ['password123', 'Teladan2025!'] // hanya simulasi
const ROLE_NAMES = { student: 'Siswa', teacher: 'Guru', admin: 'Admin' }

export const authService = {
  async login(identifier, password, { remember = true, role } = {}) {
    await new Promise((r) => setTimeout(r, 400))
    const id = identifier.trim().toLowerCase()
    const user = users.find((u) => u.email === id || u.username === id || u.nisn === id)
    if (!user || !PASSWORDS.includes(password)) throw new Error('NISN/email/username atau kata sandi salah.')
    if (role && user.role !== role) throw new Error(`Akun ini bukan akun ${ROLE_NAMES[role]}. Pilih peran yang sesuai.`)
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
    ;(remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify({ ...user, v: SESSION_V }))
    return user
  },
  updateSession(patch) {
    const area = sessionStorage.getItem(KEY) ? sessionStorage : localStorage
    const next = { ...this.getSession(), ...patch }
    area.setItem(KEY, JSON.stringify(next))
    return next
  },
  logout() {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
  },
  getSession() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY))
      if (s && s.v === SESSION_V) return s
      this.logout()
      return null
    } catch {
      return null
    }
  },
  // Simulasi: tidak ada email yang dikirim dan tidak ada reset di server.
  async requestPasswordReset() {
    await new Promise((r) => setTimeout(r, 400))
    return { simulated: true }
  },
}

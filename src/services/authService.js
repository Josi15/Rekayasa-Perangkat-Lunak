import { users } from '../data/mock.js'

const KEY = 'simba_session'
const MOCK_PASSWORD = 'password123' // hanya simulasi

export const authService = {
  async login(identifier, password) {
    await new Promise((r) => setTimeout(r, 400))
    const id = identifier.trim().toLowerCase()
    const user = users.find((u) => u.email === id || u.username === id)
    if (!user || password !== MOCK_PASSWORD) throw new Error('Email/username atau kata sandi salah.')
    localStorage.setItem(KEY, JSON.stringify(user))
    return user
  },
  updateSession(patch) {
    const next = { ...this.getSession(), ...patch }
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  },
  logout() {
    localStorage.removeItem(KEY)
  },
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(KEY))
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

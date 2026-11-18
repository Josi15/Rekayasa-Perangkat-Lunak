import { apiRequest, resetCsrf } from '../http'
import { invalidateCatalog } from './catalog'
import { mapUser, item } from './adapt'
import { loadTeacherContext } from './teacherViewApi'
import { applyTeacherContext } from '../../data/teacherHome'

// Sesi = cookie Sanctum (HttpOnly) — tidak ada token/peran di localStorage. Peran & status SELALU dari /auth/me.
// 401 saat memulihkan sesi adalah keadaan normal (belum login), jadi tidak memicu handler "sesi berakhir" (quiet401).
export const authApi = {
  needsRestore: true, // AuthContext harus memanggil restore() saat aplikasi dimuat
  currentUser: () => null,

  async restore() {
    try { return mapUser(item(await apiRequest('/auth/me', { quiet401: true }))) }
    catch (e) { if (e?.status === 401) return null; throw e }
  },

  // identifier boleh username, NISN, atau NIP (sesuai backend).
  async login({ identifier, password }) {
    const r = await apiRequest('/auth/login', { method: 'POST', body: { login: String(identifier ?? '').trim(), password }, quiet401: true })
    resetCsrf(); invalidateCatalog() // sesi baru → token CSRF & data relasi lama tidak berlaku
    return mapUser(item(r))
  },

  async logout() {
    try { await apiRequest('/auth/logout', { method: 'POST', quiet401: true }) }
    catch (e) { if (e?.status !== 401) throw e }
    finally { resetCsrf(); invalidateCatalog() }
  },

  updateSession: (patch) => patch,

  // Dipanggil setelah login/restore: guru → muat konteks (mapel, wali kelas, NIP) ke teks header halaman guru.
  async afterAuth(user) {
    if (user?.role !== 'teacher') return
    try { applyTeacherContext(await loadTeacherContext()) }
    catch { applyTeacherContext({ nip: '-', subject: '-', homeroom: { classId: 0, name: '-', total: 0 }, academicYear: '-', semester: '-' }) }
  },

  // Respons backend selalu generik (anti-enumerasi akun).
  requestPasswordReset: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email: String(email ?? '').trim() }, quiet401: true }),
  validateResetToken: ({ email, token }) => apiRequest('/auth/reset-password/validate', { method: 'POST', body: { email, token }, quiet401: true }),
  resetPassword: ({ email, token, password, confirm }) => apiRequest('/auth/reset-password', { method: 'POST', body: { email, token, password, password_confirmation: confirm }, quiet401: true }),
}

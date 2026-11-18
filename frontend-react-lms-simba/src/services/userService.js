import { request } from './http'
import { db, nextId, findUser, fail } from './db'
import { pick } from './mode'
import { userApi } from './api/masterApi'

const ROLES = ['student', 'teacher', 'admin']
const STATUSES = ['active', 'inactive', 'pending']
const EMAIL = /^\S+@\S+\.\S+$/
const view = (u) => ({ ...u })
const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

function validate(d, id) {
  if (!d.name?.trim()) fail('Nama wajib diisi.')
  if (!EMAIL.test(d.email ?? '')) fail('Email tidak valid.')
  if (!d.username?.trim()) fail('Username wajib diisi.')
  if (!ROLES.includes(d.role)) fail('Peran tidak valid.')
  if (d.status && !STATUSES.includes(d.status)) fail('Status tidak valid.')
  if (db.users.some((u) => u.id !== id && same(u.email, d.email))) fail('Email sudah dipakai pengguna lain.')
  if (db.users.some((u) => u.id !== id && same(u.username, d.username))) fail('Username sudah dipakai pengguna lain.')
  if (d.password && d.password.length < 8) fail('Kata sandi sementara minimal 8 karakter.')
}

// Peran tidak boleh diubah bila pengguna masih dirujuk data lain (integritas referensi).
function assertRoleChangeable(u, role) {
  if (u.role === role) return
  const teaches = db.subjects.some((s) => s.teacherId === u.id) || db.classes.some((c) => c.homeroomId === u.id) || db.teachingClasses.some((c) => c.teacherId === u.id)
  if (u.role === 'teacher' && teaches) fail('Guru ini masih menjadi pengampu mapel atau wali kelas. Ganti dulu penugasannya.')
  if (u.role === 'student' && db.teachingClasses.some((c) => c.studentIds.includes(u.id))) fail('Siswa ini masih terdaftar di kelas.')
}

const mockUserService = {
  list: () => request(() => db.users.map(view)),
  get: (id) => request(() => { const u = findUser(id); return u ? view(u) : null }),
  create: (d) => request(() => {
    validate(d)
    const u = { id: nextId('users'), name: d.name.trim(), email: d.email.trim(), username: d.username.trim(), role: d.role, status: d.status ?? 'active' }
    if (d.role === 'student' && d.nisn) u.nisn = d.nisn.trim()
    if (d.role === 'teacher' && d.nip) u.nip = d.nip.trim()
    db.users.push(u)
    if (d.password) db.credentials[u.id] = d.password // kata sandi demo, hanya di memori
    return view(u)
  }),
  update: (id, d, actorId) => request(() => {
    const u = findUser(id)
    if (!u) fail('Pengguna tidak ditemukan.')
    validate({ ...u, ...d }, u.id)
    const next = { ...u, ...d }
    if (u.id === Number(actorId) && (next.role !== u.role || next.status !== u.status)) fail('Anda tidak dapat mengubah peran atau status akun sendiri.')
    assertRoleChangeable(u, next.role)
    Object.assign(u, { name: next.name.trim(), email: next.email.trim(), username: next.username.trim(), role: next.role, status: next.status })
    if (d.nisn !== undefined) u.nisn = d.nisn?.trim() || undefined
    if (d.nip !== undefined) u.nip = d.nip?.trim() || undefined
    if (d.password) db.credentials[u.id] = d.password
    return view(u)
  }),
  setStatus: (id, status, actorId) => request(() => {
    const u = findUser(id)
    if (!u) fail('Pengguna tidak ditemukan.')
    if (!STATUSES.includes(status)) fail('Status tidak valid.')
    if (u.id === Number(actorId) && status !== 'active') fail('Anda tidak dapat menonaktifkan akun sendiri.')
    u.status = status
    return view(u)
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const userService = pick(mockUserService, userApi)

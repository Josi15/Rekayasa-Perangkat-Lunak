import { request } from './http'
import { db, findUser } from './db'
import { profileStore as st } from './profileStore'
import { pick } from './mode'
import { profileApi } from './api/activityApi'

const PHONE = /^(\+62|62|0)8\d{7,11}$/
const EMAIL = /^\S+@\S+\.\S+$/
// Seluruh perubahan hanya di memori (simulasi); validasi diulang di sini agar kontraknya sama dengan API nanti.
const mockProfileService = {
  get: () => request(() => st),
  update: (d) => request(() => {
    if (!d.name?.trim()) throw new Error('Nama wajib diisi.')
    if (!EMAIL.test(d.email)) throw new Error('Email tidak valid.')
    if (!PHONE.test(String(d.phone).replace(/[\s-]/g, ''))) throw new Error('Nomor WhatsApp tidak valid.')
    Object.assign(st, { name: d.name.trim(), email: d.email.trim(), phone: d.phone.trim(), address: d.address.trim(), updatedAt: Date.now() })
    // Sinkron ke data pengguna bersama agar nama/email baru tampil di halaman lain (admin, daftar kelas, dll.).
    const u = findUser(2)
    if (u) Object.assign(u, { name: st.name, email: st.email })
    return st
  }),
  setPhoto: (dataUrl) => request(() => { st.photo = dataUrl; return true }),
  setTwoFA: (on) => request(() => { st.twoFA = on; return on }),
  signOutOthers: () => request(() => { const n = st.otherSessions.length; st.otherSessions = []; return n }),
  // Simulasi: hanya memvalidasi; kata sandi tidak diubah di mana pun.
  changePassword: ({ current }) => request(() => {
    if (current !== db.credentials[2]) throw new Error('Kata sandi saat ini salah.')
    return { simulated: true }
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const profileService = pick(mockProfileService, profileApi)

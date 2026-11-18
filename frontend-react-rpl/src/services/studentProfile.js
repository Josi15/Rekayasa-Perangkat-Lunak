import { delay } from './api.js'
import * as d from '../data/student.js'
import { store } from './studentStore.js'
import { authService } from './authService.js'

const KEY = (uid) => `simba_profile_${uid}`
const emailRe = /^\S+@\S+\.\S+$/

export function validateProfile(v) {
  const e = {}
  if (v.name.trim().length < 3) e.name = 'Nama minimal 3 karakter.'
  if (!emailRe.test(v.email.trim())) e.email = 'Format email tidak valid.'
  if (v.phone && !/^[0-9+\-\s]{8,16}$/.test(v.phone.trim())) e.phone = 'Nomor telepon 8-16 karakter (angka, +, -).'
  if (v.address.length > 200) e.address = 'Alamat maksimal 200 karakter.'
  return e
}
export function validatePassword(v) {
  const e = {}
  if (!v.current) e.current = 'Kata sandi saat ini wajib diisi.'
  if (v.next.length < 8) e.next = 'Kata sandi baru minimal 8 karakter.'
  else if (!/[A-Za-z]/.test(v.next) || !/\d/.test(v.next)) e.next = 'Harus mengandung huruf dan angka.'
  else if (v.next === v.current) e.next = 'Kata sandi baru harus berbeda.'
  if (v.confirm !== v.next) e.confirm = 'Konfirmasi tidak sama.'
  return e
}

export const studentProfile = {
  async get(uid) {
    const session = authService.getSession()
    return delay({ ...d.profileSeed[uid], ...store.get(KEY(uid), {}), name: session.name, email: session.email })
  },
  async update(uid, v) {
    if (Object.keys(validateProfile(v)).length) throw new Error('Data profil tidak valid.')
    store.set(KEY(uid), { phone: v.phone.trim(), address: v.address.trim() })
    authService.updateSession({ name: v.name.trim(), email: v.email.trim().toLowerCase() })
    return this.get(uid)
  },
  // Simulasi: tidak ada perubahan kata sandi yang tersimpan.
  async changePasswordSimulated(v) {
    if (Object.keys(validatePassword(v)).length) throw new Error('Data kata sandi tidak valid.')
    return delay({ simulated: true })
  },
}

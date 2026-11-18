import { request } from './http'
import { db, fail } from './db'
import { pick } from './mode'
import { settingApi } from './api/activityApi'

const mockSettingService = {
  get: () => request(() => db.settings),
  update: (d) => request(() => {
    if (!d.schoolName?.trim()) fail('Nama sekolah wajib diisi.')
    const m = /^(\d{4})\/(\d{4})$/.exec(String(d.academicYear ?? '').trim())
    if (!m || Number(m[2]) !== Number(m[1]) + 1) fail('Tahun ajaran harus berformat 2026/2027.')
    if (!['Ganjil', 'Genap'].includes(d.semester)) fail('Semester harus Ganjil atau Genap.')
    Object.assign(db.settings, { schoolName: d.schoolName.trim(), academicYear: m[0], semester: d.semester })
    return db.settings
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const settingService = pick(mockSettingService, settingApi)

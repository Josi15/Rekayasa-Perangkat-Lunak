import { request } from './http'
import { scheduleMatrix as m } from '../data/scheduleMatrix'
import { pick } from './mode'
import { teacherScheduleApi } from './api/teacherViewApi'

// Beban JP & daftar kelas diturunkan dari matriks, bukan ditulis manual.
const mockTeacherScheduleService = {
  get: () => request(() => {
    const jpOf = Object.fromEntries(m.rows.filter((r) => r.type === 'slot').map((r) => [r.id, r.jp]))
    const teaching = Object.entries(m.cells).filter(([, c]) => c.kind === 'teach' || c.kind === 'lab')
    return { ...m, jp: teaching.reduce((s, [k]) => s + jpOf[k.split('-')[0]], 0), classes: [...new Set(teaching.map(([, c]) => c.className))] }
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const teacherScheduleService = pick(mockTeacherScheduleService, teacherScheduleApi)

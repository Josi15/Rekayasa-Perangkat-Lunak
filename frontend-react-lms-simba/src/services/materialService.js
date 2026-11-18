import { request } from './http'
import { db, nextId, className, subjectName, studentClassIds, today, fail } from './db'
import { pick } from './mode'
import { materialApi } from './api/contentApi'

const view = (m) => ({ ...m, classNames: m.classIds.map(className), subjectName: subjectName(m.subjectId) })
const subjectOfClass = (classId) => db.teachingClasses.find((t) => t.classId === classId)?.subjectId ?? 1

const mockMaterialService = {
  list: () => request(() => db.materials.map(view)),
  get: (id) => request(() => { const m = db.materials.find((x) => x.id === Number(id)); return m ? view(m) : null }),
  // Materi yang dipublikasikan untuk kelas aktif milik siswa.
  forStudent: (uid) => request(() => {
    const mine = studentClassIds(uid)
    return db.materials.filter((m) => m.status === 'published' && m.classIds.some((c) => mine.includes(c))).sort((a, b) => a.order - b.order).map(view)
  }),
  getForStudent: (uid, id) => request(() => {
    const mine = studentClassIds(uid)
    const m = db.materials.find((x) => x.id === Number(id) && x.status === 'published' && x.classIds.some((c) => mine.includes(c)))
    return m ? view(m) : null
  }),
  save: (data) => request(() => {
    if (data.id) {
      const i = db.materials.findIndex((m) => m.id === data.id)
      if (i < 0) fail('Materi tidak ditemukan.')
      db.materials[i] = { ...db.materials[i], ...data, updatedAt: today() }
      return view(db.materials[i])
    }
    const m = { subjectId: subjectOfClass(data.classIds?.[0]), ...data, id: nextId('materials'), order: db.materials.length + 1, updatedAt: today() }
    db.materials.push(m)
    return view(m)
  }),
  remove: (id) => request(() => {
    db.materials = db.materials.filter((m) => m.id !== id).sort((a, b) => a.order - b.order).map((m, i) => ({ ...m, order: i + 1 }))
    return true
  }),
  move: (id, dir) => request(() => {
    const list = [...db.materials].sort((a, b) => a.order - b.order)
    const i = list.findIndex((m) => m.id === id), j = i + dir
    if (j < 0 || j >= list.length) return false
    ;[list[i].order, list[j].order] = [list[j].order, list[i].order]
    db.materials = list
    return true
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const materialService = pick(mockMaterialService, materialApi)

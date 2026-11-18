import { request } from './http'
import { db, nextId, findUser, userName, subjectName, fail } from './db'
import { pick } from './mode'
import { classApi } from './api/masterApi'

const view = (c) => {
  const teachings = db.teachingClasses.filter((t) => t.classId === c.id)
  const studentIds = [...new Set(teachings.flatMap((t) => t.studentIds))]
  return {
    ...c, homeroom: userName(c.homeroomId), studentIds, enrolled: studentIds.length,
    subjects: [...new Set(teachings.map((t) => subjectName(t.subjectId)))],
  }
}

function validate(d, id) {
  if (!d.name?.trim()) fail('Nama kelas wajib diisi.')
  if (db.classes.some((c) => c.id !== id && c.name.toLowerCase() === d.name.trim().toLowerCase())) fail('Nama kelas sudah ada.')
  if (findUser(d.homeroomId)?.role !== 'teacher') fail('Wali kelas harus seorang guru.')
  const n = Number(d.size)
  if (!Number.isInteger(n) || n < 1 || n > 60) fail('Jumlah siswa harus bilangan bulat 1–60.')
}

const mockClassService = {
  list: () => request(() => db.classes.map(view)),
  get: (id) => request(() => { const c = db.classes.find((x) => x.id === Number(id)); return c ? view(c) : null }),
  create: (d) => request(() => {
    validate(d)
    const c = { id: nextId('classes'), name: d.name.trim(), homeroomId: Number(d.homeroomId), size: Number(d.size), status: 'active' }
    db.classes.push(c)
    return view(c)
  }),
  update: (id, d) => request(() => {
    const c = db.classes.find((x) => x.id === Number(id))
    if (!c) fail('Kelas tidak ditemukan.')
    validate({ ...c, ...d }, c.id)
    Object.assign(c, { name: (d.name ?? c.name).trim(), homeroomId: Number(d.homeroomId ?? c.homeroomId), size: Number(d.size ?? c.size) })
    return view(c)
  }),
  setStatus: (id, status) => request(() => {
    const c = db.classes.find((x) => x.id === Number(id))
    if (!c) fail('Kelas tidak ditemukan.')
    if (!['active', 'archived'].includes(status)) fail('Status tidak valid.')
    if (status === 'archived' && db.teachingClasses.some((t) => t.classId === c.id && t.status === 'active')) fail('Kelas masih memiliki pengampuan aktif dan tidak dapat diarsipkan.')
    c.status = status
    return view(c)
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const classService = pick(mockClassService, classApi)

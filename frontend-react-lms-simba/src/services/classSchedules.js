// Jadwal kelas dikelola admin dan dibaca siswa (satu sumber data).
import { delay } from './api.js'
import { store } from './studentStore.js'
import { classSchedulesSeed, teachers, rooms, dayOptions } from '../data/admin.js'
import { classes } from '../data/mock.js'
import { courses } from '../data/student.js'

const KEY = 'simba_class_schedules'
const all = () => store.get(KEY, classSchedulesSeed)
const save = (list) => store.set(KEY, list)

export const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const overlap = (a, b) => toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end)

export function decorate(e) {
  return {
    ...e,
    courseName: courses.find((c) => c.id === e.courseId)?.name ?? '-',
    teacher: teachers.find((t) => t.id === e.teacherId)?.name ?? '-',
    className: classes.find((c) => c.id === e.classId)?.name ?? '-',
  }
}

const normalize = (v) => ({ classId: Number(v.classId), day: Number(v.day), start: v.start, end: v.end, courseId: Number(v.courseId), teacherId: Number(v.teacherId), room: v.room })

// Validasi form + bentrok jadwal (kelas, guru, ruang) pada hari dan jam yang beririsan.
export function validateEntry(raw, list, ignoreId) {
  const v = normalize(raw)
  const e = {}
  if (!v.day) e.day = 'Pilih hari (Senin-Jumat).'
  if (!v.courseId) e.courseId = 'Pilih mata pelajaran.'
  if (!v.teacherId) e.teacherId = 'Pilih guru.'
  if (!v.room) e.room = 'Pilih ruang.'
  if (!v.start || !v.end) e.time = 'Isi jam mulai dan jam selesai.'
  else if (toMin(v.start) >= toMin(v.end)) e.time = 'Jam selesai harus setelah jam mulai.'
  else if (toMin(v.start) < 360 || toMin(v.end) > 1020) e.time = 'Jam pelajaran antara 06:00 dan 17:00.'
  if (e.time || e.day) return e
  const others = list.filter((x) => x.id !== ignoreId && x.day === v.day && overlap(x, v))
  const sameClass = others.find((x) => x.classId === v.classId)
  if (sameClass) e.time = `Bentrok dengan ${decorate(sameClass).courseName} (${sameClass.start}-${sameClass.end}) di kelas ini.`
  const sameTeacher = others.find((x) => x.teacherId === v.teacherId)
  if (sameTeacher && !e.teacherId) e.teacherId = `Guru sudah mengajar di kelas ${decorate(sameTeacher).className} pada jam ini.`
  const sameRoom = others.find((x) => x.room === v.room)
  if (sameRoom && !e.room) e.room = `Ruang dipakai kelas ${decorate(sameRoom).className} pada jam ini.`
  return e
}

const invalid = (errors) => Object.assign(new Error('Jadwal tidak valid.'), { errors })

export const scheduleForClass = (classId) => all().filter((x) => x.classId === classId).map(decorate)
export const scheduleMeta = { classes, courses, teachers, rooms, dayOptions }

export const classScheduleService = {
  listClasses: () => delay(classes.map((c) => ({ ...c, scheduleCount: all().filter((x) => x.classId === c.id).length }))),
  getOverview: (classId) => delay({
    entries: scheduleForClass(classId).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start)),
    all: all(),
  }),
  async create(raw) {
    const list = all(); const errors = validateEntry(raw, list)
    if (Object.keys(errors).length) throw invalid(errors)
    const entry = { ...normalize(raw), id: Date.now() }
    save([...list, entry])
    return delay(decorate(entry))
  },
  async update(id, raw) {
    const list = all(); const errors = validateEntry(raw, list, id)
    if (Object.keys(errors).length) throw invalid(errors)
    save(list.map((x) => (x.id === id ? { ...normalize(raw), id } : x)))
    return delay(true)
  },
  async remove(id) { save(all().filter((x) => x.id !== id)); return delay(true) },
}

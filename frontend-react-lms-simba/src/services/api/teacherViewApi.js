import { apiRequest, fetchAll } from '../http'
import { loadCatalog } from './catalog'
import * as A from './adapt'

const isoDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const mins = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000))
const JP_MIN = 45

// Tahun ajaran diturunkan dari tanggal (Juli–Desember = Ganjil, Januari–Juni = Genap); backend belum punya pengaturan tahun ajaran.
export function termOf(d = new Date()) {
  const y = d.getFullYear(), ganjil = d.getMonth() >= 6
  return { academicYear: ganjil ? `${y}/${y + 1}` : `${y - 1}/${y}`, semester: ganjil ? 'Ganjil' : 'Genap' }
}

// ---- Konteks guru (teks header halaman: mapel, wali kelas, NIP) dibaca dari backend, bukan data demo.
export async function loadTeacherContext() {
  const [me, cat] = await Promise.all([apiRequest('/profil').then(A.item), loadCatalog()])
  const home = cat.kelas.find((k) => Number(k.id_wali) === Number(me.id_pengguna))
  return {
    nip: me.nip ?? '-', subject: cat.mapel.map((m) => m.nama_mapel).join(', ') || '-',
    homeroom: { classId: home ? Number(home.id_kelas) : 0, name: home?.nama_kelas ?? '-', total: home?.jumlah_siswa ?? 0 },
    ...termOf(),
  }
}

// ---- Matriks jadwal mingguan (Senin–Jumat) dari sesi jadwal guru.
export const teacherScheduleApi = {
  async get() {
    const [raw, cat] = await Promise.all([fetchAll('/jadwal'), loadCatalog()])
    const week = (await import('./activityApi')).weekly(raw.map(A.mapSchedule)).filter((r) => r.dayIndex >= 1 && r.dayIndex <= 5)
    const slotKeys = [...new Set(week.map((r) => `${r.time}|${r.endTime}`))].sort()
    const rows = slotKeys.map((k, i) => { const [start, end] = k.split('|'); const m = mins(`2000-01-01T${start}`, `2000-01-01T${end}`); return { type: 'slot', id: `s${i + 1}`, label: `Sesi ${i + 1}`, start, end, jp: Math.max(1, Math.round(m / JP_MIN)) } })
    const idOf = Object.fromEntries(slotKeys.map((k, i) => [k, `s${i + 1}`]))
    const days = [{ index: 1, label: 'Senin' }, { index: 2, label: 'Selasa' }, { index: 3, label: 'Rabu' }, { index: 4, label: 'Kamis' }, { index: 5, label: 'Jumat' }]
    const cells = {}
    for (const r of rows) for (const d of days) cells[`${r.id}-${d.index}`] = { kind: 'note', title: 'Tidak ada sesi', topic: '' }
    for (const r of week) cells[`${idOf[`${r.time}|${r.endTime}`]}-${r.dayIndex}`] = { kind: 'teach', className: r.className, topic: r.subjectName, room: '-' }
    const jpOf = Object.fromEntries(rows.map((r) => [r.id, r.jp]))
    const teaching = Object.entries(cells).filter(([, c]) => c.kind === 'teach')
    const studentCount = Object.fromEntries(cat.kelas.map((k) => [k.nama_kelas, k.jumlah_siswa ?? 0]))
    return { ...termOf(), standardJp: 24, days, studentCount, rows, cells, labs: [], jp: teaching.reduce((s, [k]) => s + jpOf[k.split('-')[0]], 0), classes: [...new Set(teaching.map(([, c]) => c.className))] }
  },
}

// ---- Dashboard guru (bentuk sama dengan teacherHome mock).
export const teacherHomeApi = {
  async get() {
    const [dash, ctx, sched, cat] = await Promise.all([apiRequest('/dashboard').then(A.item), loadTeacherContext(), fetchAll('/jadwal').then((r) => r.map(A.mapSchedule)), loadCatalog()])
    const weekly = (await import('./activityApi')).weekly(sched)
    const jp = weekly.filter((r) => r.dayIndex <= 5).reduce((s, r) => s + Math.max(1, Math.round(mins(r.startsAt, r.endsAt) / JP_MIN)), 0)
    const target = 24
    const today = isoDay()
    const todays = sched.filter((r) => isoDay(new Date(r.startsAt)) === today).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    const now = Date.now()
    const live = todays.find((r) => new Date(r.startsAt) <= now && now <= new Date(r.endsAt))
    const focus = live ?? todays.find((r) => new Date(r.startsAt) > now) ?? null
    const total = focus ? mins(focus.startsAt, focus.endsAt) : 0
    const used = focus && live ? mins(focus.startsAt, new Date()) : 0
    const session = focus
      ? { title: `${focus.subjectName} ${focus.className}`, period: `${focus.time} - ${focus.endTime} WIB`, room: '-', topic: focus.subjectName, remaining: live ? `${Math.max(0, total - used)} menit` : 'belum dimulai', progress: total && live ? Math.min(100, Math.round((used / total) * 100)) : 0, clock: `${new Date().toTimeString().slice(0, 5)} WIB` }
      : { title: 'Tidak ada sesi mengajar hari ini', period: '-', room: '-', topic: '-', remaining: '-', progress: 0, clock: `${new Date().toTimeString().slice(0, 5)} WIB` }
    const agenda = todays.filter((r) => new Date(r.endsAt) >= now).map((r) => ({ id: r.id, time: `${r.time} - ${r.endTime}`, className: r.className, topic: r.subjectName, room: '-', status: live && live.id === r.id ? 'running' : 'upcoming' }))
    // Presensi hari ini kelas binaan (wali kelas).
    let att = { present: 0, permit: 0, sick: 0 }
    if (ctx.homeroom.classId) {
      const rows = await fetchAll('/presensi', { id_kelas: ctx.homeroom.classId, tanggal: today }).catch(() => [])
      const c = (...k) => rows.filter((p) => k.includes(p.status_kehadiran)).length
      att = { present: c('hadir', 'terlambat'), permit: c('izin'), sick: c('sakit') }
    }
    const tasks = (dash.ringkasan_pengumpulan?.tugas_terbaru ?? []).slice(0, 3)
    const recent = (await Promise.all(tasks.map(async (t) => (await fetchAll(`/tugas/${t.id_tugas}/pengumpulan`).catch(() => [])).map((p) => ({ id: Number(p.id_pengumpulan), assignmentId: Number(t.id_tugas), name: p.siswa ? A.nameOf(p.siswa) : '-', file: t.judul, className: cat.rel.className(cat.rel.classIdsOfMapel(cat.mapel.find((m) => m.nama_mapel === t.mapel)?.id_mapel)[0]) ?? '-', submittedAt: p.waktu_kumpul }))))).flat().sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt))).slice(0, 3)
    return {
      academicYear: `${ctx.academicYear} ${ctx.semester}`, nip: ctx.nip, subject: ctx.subject,
      workload: { jp, target, percent: Math.min(100, Math.round((jp / target) * 100)) },
      attendance: { average: dash.jumlah_siswa ? Math.round(((att.present) / Math.max(1, ctx.homeroom.total)) * 1000) / 10 : 0, classes: dash.jumlah_kelas_diajar ?? 0 },
      homeroom: { ...ctx.homeroom, ...att, note: ctx.homeroom.classId ? 'Data presensi hari ini dari backend.' : 'Anda belum menjadi wali kelas.' },
      session, agenda, queue: { count: dash.tugas_perlu_dinilai ?? 0, classCount: dash.jumlah_kelas_diajar ?? 0 }, recent,
    }
  },
}

import { delay } from './api.js'
import * as d from '../data/student.js'
import { store, emitNoticeChange } from './studentStore.js'
import { loadTasks } from './studentTasks.js'
import { timeLeft } from '../utils/date.js'

const READ = (uid) => `simba_read_${uid}`
const readSet = (uid) => new Set(store.get(READ(uid), d.initialReadAnnouncements.map((i) => `a-${i}`)))
const saveRead = (uid, set) => { store.set(READ(uid), [...set]); emitNoticeChange() }

export function announcementsFor(uid) {
  const r = readSet(uid)
  return [...d.studentAnnouncements].sort((a, b) => new Date(b.at) - new Date(a.at)).map((a) => ({ ...a, read: r.has(`a-${a.id}`) }))
}

function notificationsFor(uid) {
  const r = readSet(uid)
  const now = Date.now()
  const out = []
  loadTasks(uid).forEach((t) => {
    const left = new Date(t.due) - now
    const to = `/student/tasks/${t.id}`
    if (t.status === 'todo' && left < 3 * 864e5) out.push({ id: `n-due-${t.id}`, title: 'Tenggat segera', text: `"${t.title}" berakhir ${timeLeft(t.due)}.`, at: new Date(now).toISOString(), to })
    if (t.status === 'overdue') out.push({ id: `n-late-${t.id}`, title: 'Tugas terlambat', text: `"${t.title}" sudah lewat tenggat dan belum dikumpulkan.`, at: t.due, to })
    if (t.status === 'graded' && now - new Date(t.gradedAt) < 7 * 864e5) out.push({ id: `n-grade-${t.id}`, title: 'Nilai baru', text: `"${t.title}" dinilai: ${t.score}.`, at: t.gradedAt, to: '/student/grades' })
    if (t.status === 'submitted' && t.submission?.submittedAt && now - new Date(t.submission.submittedAt) < 7 * 864e5) out.push({ id: `n-sub-${t.id}`, title: 'Tugas diterima', text: `"${t.title}" berhasil dikumpulkan.`, at: t.submission.submittedAt, to })
  })
  return out.sort((a, b) => new Date(b.at) - new Date(a.at)).map((n) => ({ ...n, read: r.has(n.id) }))
}

export const studentNotices = {
  listAnnouncements: (uid) => delay(announcementsFor(uid)),
  async getAnnouncement(uid, id) {
    const a = announcementsFor(uid).find((x) => x.id === id)
    if (!a) throw new Error('Pengumuman tidak ditemukan.')
    if (!a.read) { const r = readSet(uid); r.add(`a-${id}`); saveRead(uid, r) }
    return delay({ ...a, read: true })
  },
  listNotifications: (uid) => delay(notificationsFor(uid)),
  async markRead(uid, ids) { const r = readSet(uid); ids.forEach((i) => r.add(i)); saveRead(uid, r); return delay(true) },
  async markAllNotificationsRead(uid) { return this.markRead(uid, notificationsFor(uid).map((n) => n.id)) },
}

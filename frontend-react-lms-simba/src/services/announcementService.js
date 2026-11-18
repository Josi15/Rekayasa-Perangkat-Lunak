import { request } from './http'
import { db, nextId, today, fail } from './db'
import { pick } from './mode'
import { announcementApi } from './api/activityApi'

const AUDIENCES = ['all', 'student', 'teacher']
const newest = (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id
const find = (id) => db.announcements.find((a) => a.id === Number(id))

function validate(d) {
  if (!d.title?.trim()) fail('Judul wajib diisi.')
  if (d.title.trim().length > 120) fail('Judul maksimal 120 karakter.')
  if (!d.body?.trim()) fail('Isi pengumuman wajib diisi.')
  if (!AUDIENCES.includes(d.audience)) fail('Sasaran tidak valid.')
  if (!['draft', 'published'].includes(d.status)) fail('Status tidak valid.')
}

const mockAnnouncementService = {
  list: () => request(() => [...db.announcements].sort(newest)),
  get: (id) => request(() => find(id) ?? null),
  // Yang boleh dibaca peran tertentu: hanya yang dipublikasikan dan ditujukan ke peran itu / semua.
  forRole: (role) => request(() => db.announcements.filter((a) => a.status === 'published' && (a.audience === 'all' || a.audience === role)).sort(newest)),
  create: (d, authorName) => request(() => {
    validate(d)
    const a = { id: nextId('announcements'), title: d.title.trim(), category: d.category?.trim() || 'Umum', audience: d.audience, status: d.status, author: authorName ?? 'Admin', createdAt: today(), body: d.body.trim() }
    db.announcements.push(a)
    return a
  }),
  update: (id, d) => request(() => {
    const a = find(id)
    if (!a) fail('Pengumuman tidak ditemukan.')
    validate({ ...a, ...d })
    Object.assign(a, { title: (d.title ?? a.title).trim(), category: (d.category ?? a.category).trim() || 'Umum', audience: d.audience ?? a.audience, status: d.status ?? a.status, body: (d.body ?? a.body).trim() })
    return a
  }),
  remove: (id) => request(() => {
    if (!find(id)) fail('Pengumuman tidak ditemukan.')
    db.announcements = db.announcements.filter((a) => a.id !== Number(id))
    return true
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const announcementService = pick(mockAnnouncementService, announcementApi)

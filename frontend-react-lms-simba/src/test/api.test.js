// Tes lapisan API (services/api/*) terhadap respons berbentuk Resource Laravel. fetch diganti stub; TIDAK ada jaringan
// dan TIDAK menguji backend sungguhan (lihat docs/TAHAP-2.md untuk batasannya). Bentuk fixture mengikuti Resource class backend.
import { afterEach, beforeEach } from 'vitest'
import { apiRequest, fetchAll, resetCsrf, onUnauthorized, ApiError } from '../services/http'
import { authApi } from '../services/api/authApi'
import { userApi, classApi } from '../services/api/masterApi'
import { materialApi, assignmentApi, submissionApi, teacherAssignmentApi } from '../services/api/contentApi'
import { weekly, scheduleApi, attendanceApi } from '../services/api/activityApi'
import { invalidateCatalog } from '../services/api/catalog'
import * as A from '../services/api/adapt'

const res = (status, body, headers = {}) => ({ status, ok: status >= 200 && status < 300, headers: { get: (k) => headers[k] ?? null }, json: async () => body, blob: async () => new Blob(['x']) })
let calls, routes
const route = (method, pattern, handler) => routes.push({ method, pattern, handler })
beforeEach(() => {
  calls = []; routes = []; resetCsrf(); invalidateCatalog()
  document.cookie = 'XSRF-TOKEN=tok; path=/'
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const path = String(url).replace(/^.*\/api\/v1/, '').split('?')[0]
    const method = (init.method ?? 'GET').toUpperCase()
    calls.push({ method, path, url: String(url), init })
    if (path.endsWith('/sanctum/csrf-cookie') || String(url).endsWith('/sanctum/csrf-cookie')) return res(204, null)
    const r = routes.find((x) => x.method === method && (typeof x.pattern === 'string' ? x.pattern === path : x.pattern.test(path)))
    if (!r) return res(200, { data: [], meta: { current_page: 1, last_page: 1 } })
    return r.handler({ path, init, url: String(url) })
  })
})
afterEach(() => { vi.restoreAllMocks(); document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' })
const page = (data) => res(200, { data, meta: { current_page: 1, last_page: 1 } })

// ------------------------------------------------------------ adapter murni
test('mapUser: peran/status backend → bentuk frontend; nama diturunkan dari identitas (backend tak punya nama lengkap)', () => {
  expect(A.mapUser({ id_pengguna: 7, nisn: '0012345678', username: null, email: 'a@b.id', peran: 'siswa', aktif: true })).toEqual({ id: 7, name: '0012345678', email: 'a@b.id', username: '', role: 'student', status: 'active', nisn: '0012345678' })
  expect(A.mapUser({ id_pengguna: 1, username: 'admin', peran: 'admin', aktif: false }).status).toBe('inactive')
  expect(A.mapUser({ id_pengguna: 2, nip: '1'.repeat(18), username: 'bu.ratna', peran: 'guru', aktif: true }).role).toBe('teacher')
})

test('userPayload: identitas login sesuai peran (siswa=NISN, guru=NIP, admin=username); peran tidak dikirim saat ubah', () => {
  expect(A.userPayload({ role: 'student', nisn: '0012345678', email: 'x@y.id', password: 'Rahasia12345', name: 'diabaikan' }, { creating: true })).toEqual({ peran: 'siswa', nisn: '0012345678', email: 'x@y.id', password: 'Rahasia12345' })
  expect(A.userPayload({ role: 'admin', username: 'adm', email: '' }, { creating: true })).toEqual({ peran: 'admin', username: 'adm', email: null })
  expect(A.userPayload({ role: 'teacher', nip: '1'.repeat(18), email: 'g@y.id' }, { creating: false })).toEqual({ nip: '1'.repeat(18), email: 'g@y.id' })
})

test('mapAssignment/mapSubmission: status terbuka→published, tertutup→archived; nilai digabung; terlambat dihitung', () => {
  const a = A.mapAssignment({ id_tugas: 5, judul: 'T', instruksi: 'i', batas_waktu: '2026-11-20T10:00:00+07:00', id_mapel: 2, mapel: { nama_mapel: 'MTK' }, status: 'tertutup', punya_lampiran: true }, { classIdsOfMapel: () => [9], className: () => 'X IPA 1' })
  expect(a).toMatchObject({ id: 5, status: 'archived', classId: 9, className: 'X IPA 1', subjectName: 'MTK' })
  expect(a.attachments[0]).toMatchObject({ path: '/tugas/5/lampiran', remote: true })
  const s = A.mapSubmission({ id_pengumpulan: 3, id_tugas: 5, id_siswa: 4, status: 'dinilai', waktu_kumpul: '2026-11-21T10:00:00+07:00' }, { id_nilai: 8, nilai: '88.50', umpan_balik: 'ok' }, { batas_waktu: '2026-11-20T10:00:00+07:00' })
  expect(s).toMatchObject({ id: 3, status: 'graded', score: 88.5, feedback: 'ok', late: true, nilaiId: 8 })
})

test('weekly: sesi bertanggal yang berulang dilipat jadi satu entri mingguan', () => {
  const j = (id, d) => A.mapSchedule({ id_jadwal: id, id_kelas: 1, id_mapel: 2, id_guru: 3, waktu_mulai: `${d}T08:00:00+00:00`, waktu_selesai: `${d}T09:30:00+00:00`, durasi_menit: 90, status: 'akan_datang', kelas: { nama_kelas: 'X' }, mapel: { nama_mapel: 'M' } })
  expect(weekly([j(1, '2099-01-05'), j(2, '2099-01-12'), j(3, '2099-01-19')])).toHaveLength(1)
})

// ------------------------------------------------------------ transport
test('error: 422 → pesan field pertama; 429 → Retry-After; 403/409/5xx → pesan ramah; jaringan putus → status 0', async () => {
  route('GET', '/a', () => res(422, { message: 'Data tidak valid.', code: 'validasi_gagal', errors: { nisn: ['NISN harus 10 digit.'] }, request_id: 'r1' }))
  let e = await apiRequest('/a').catch((x) => x)
  expect(e).toBeInstanceOf(ApiError); expect(e.status).toBe(422); expect(e.message).toContain('NISN harus 10 digit.'); expect(e.requestId).toBe('r1')
  route('GET', '/b', () => res(429, { message: 'Terlalu banyak percobaan.', code: 'too_many_requests' }, { 'Retry-After': '42' }))
  e = await apiRequest('/b').catch((x) => x); expect(e.status).toBe(429); expect(e.message).toContain('42 detik')
  route('GET', '/c', () => res(403, { message: '', code: 'forbidden' }))
  expect((await apiRequest('/c').catch((x) => x)).message).toMatch(/tidak memiliki akses/)
  route('GET', '/d', () => res(409, { message: 'Guru masih mengampu mapel aktif.', code: 'teacher_has_active_subjects' }))
  e = await apiRequest('/d').catch((x) => x); expect(e.code).toBe('teacher_has_active_subjects'); expect(e.message).toBe('Guru masih mengampu mapel aktif.')
  route('GET', '/e', () => res(500, { message: 'SQLSTATE[...] rahasia' }))
  expect((await apiRequest('/e').catch((x) => x)).message).not.toContain('SQLSTATE')
  globalThis.fetch = vi.fn(async () => { throw new TypeError('Failed to fetch') })
  e = await apiRequest('/f').catch((x) => x); expect(e.status).toBe(0); expect(e.code).toBe('network_error')
})

test('401 memicu handler sesi berakhir, kecuali quiet401', async () => {
  const seen = vi.fn(); const off = onUnauthorized(seen)
  route('GET', '/x', () => res(401, { message: 'Unauthenticated.', code: 'unauthenticated' }))
  await apiRequest('/x', { quiet401: true }).catch(() => {}); expect(seen).not.toHaveBeenCalled()
  await apiRequest('/x').catch(() => {}); expect(seen).toHaveBeenCalledTimes(1)
  off()
})

test('fetchAll mengikuti paginasi Laravel (meta.last_page) dan memakai per_page=100', async () => {
  route('GET', '/kelas', ({ url }) => (url.includes('page=2') ? res(200, { data: [{ id: 3 }], meta: { current_page: 2, last_page: 2 } }) : res(200, { data: [{ id: 1 }, { id: 2 }], meta: { current_page: 1, last_page: 2 } })))
  expect(await fetchAll('/kelas')).toHaveLength(3)
  expect(calls.every((c) => c.url.includes('per_page=100'))).toBe(true)
})

test('body FormData dikirim apa adanya (tanpa Content-Type JSON) dengan CSRF', async () => {
  route('POST', '/upload', () => res(201, { data: {} }))
  const fd = new FormData(); fd.append('file', new Blob(['a']), 'a.txt')
  await apiRequest('/upload', { method: 'POST', body: fd })
  const c = calls.find((x) => x.path === '/upload')
  expect(c.init.body).toBe(fd); expect(c.init.headers['Content-Type']).toBeUndefined(); expect(c.init.headers['X-XSRF-TOKEN']).toBe('tok')
})

// ------------------------------------------------------------ auth
test('auth: restore 401 → null tanpa handler; login mengirim {login,password}; peran dipetakan', async () => {
  const seen = vi.fn(); const off = onUnauthorized(seen)
  route('GET', '/auth/me', () => res(401, { message: 'Unauthenticated.' }))
  expect(await authApi.restore()).toBeNull(); expect(seen).not.toHaveBeenCalled(); off()
  route('POST', '/auth/login', () => res(200, { data: { id_pengguna: 2, username: 'guru1', peran: 'guru', aktif: true } }))
  const u = await authApi.login({ identifier: ' guru1 ', password: 'x' })
  expect(u).toMatchObject({ id: 2, role: 'teacher', status: 'active' })
  const body = JSON.parse(calls.find((c) => c.path === '/auth/login').init.body)
  expect(body).toEqual({ login: 'guru1', password: 'x' })
  expect(calls.some((c) => c.url.endsWith('/sanctum/csrf-cookie'))).toBe(true)
})

test('auth: logout 204; kata sandi lupa/reset memakai endpoint & field backend', async () => {
  route('POST', '/auth/logout', () => res(204, null))
  await authApi.logout()
  route('POST', '/auth/reset-password', () => res(200, { message: 'ok' }))
  await authApi.resetPassword({ email: 'a@b.id', token: 't', password: 'Baru12345678', confirm: 'Baru12345678' })
  expect(JSON.parse(calls.find((c) => c.path === '/auth/reset-password').init.body)).toEqual({ email: 'a@b.id', token: 't', password: 'Baru12345678', password_confirmation: 'Baru12345678' })
})

// ------------------------------------------------------------ master data
test('userApi.create: POST /admin/pengguna lalu nonaktifkan bila status bukan aktif; update menolak ganti peran', async () => {
  route('POST', '/admin/pengguna', () => res(201, { data: { id_pengguna: 9, nisn: '0012345678', peran: 'siswa', aktif: true } }))
  route('POST', '/admin/pengguna/9/nonaktifkan', () => res(200, { data: { id_pengguna: 9, nisn: '0012345678', peran: 'siswa', aktif: false } }))
  const u = await userApi.create({ role: 'student', nisn: '0012345678', status: 'inactive', password: 'Rahasia12345', email: '' })
  expect(u.status).toBe('inactive')
  route('GET', '/admin/pengguna/9', () => res(200, { data: { id_pengguna: 9, nisn: '0012345678', peran: 'siswa', aktif: true } }))
  await expect(userApi.update(9, { role: 'teacher' }, 1)).rejects.toMatchObject({ status: 422 })
})

test('classApi.list: gabung jumlah_siswa, wali, dan mapel dari jadwal', async () => {
  route('GET', '/kelas', () => page([{ id_kelas: 1, nama_kelas: 'X IPA 1', id_wali: 2, wali: { username: 'bu.ratna' }, jumlah_siswa: 30, aktif: true }]))
  route('GET', '/jadwal', () => page([{ id_jadwal: 1, id_kelas: 1, id_mapel: 4, id_guru: 2, waktu_mulai: '2099-01-05T01:00:00Z', waktu_selesai: '2099-01-05T02:00:00Z', mapel: { nama_mapel: 'Matematika' }, kelas: { nama_kelas: 'X IPA 1' } }]))
  route('GET', '/mapel', () => page([{ id_mapel: 4, nama_mapel: 'Matematika', id_guru: 2, aktif: true }]))
  const [c] = await classApi.list()
  expect(c).toMatchObject({ id: 1, name: 'X IPA 1', homeroom: 'bu.ratna', size: 30, status: 'active', subjects: ['Matematika'] })
})

// ------------------------------------------------------------ materi, tugas, nilai
const seedCatalog = () => {
  route('GET', '/mapel', () => page([{ id_mapel: 4, nama_mapel: 'Matematika', id_guru: 2, aktif: true }]))
  route('GET', '/kelas', () => page([{ id_kelas: 1, nama_kelas: 'X IPA 1', id_wali: 2, jumlah_siswa: 2, aktif: true }]))
  route('GET', '/jadwal', () => page([{ id_jadwal: 1, id_kelas: 1, id_mapel: 4, id_guru: 2, waktu_mulai: '2099-01-05T01:00:00Z', waktu_selesai: '2099-01-05T02:00:00Z' }]))
}

test('materialApi.save: mapel diturunkan dari kelas lewat jadwal; unggah multipart judul+file; materi teks jadi .txt', async () => {
  seedCatalog()
  route('POST', '/mapel/4/materi', () => res(201, { data: { id_materi: 11, judul: 'Bab 1', id_mapel: 4, ekstensi: 'pdf' } }))
  route('GET', '/materi/11', () => res(200, { data: { id_materi: 11, judul: 'Bab 1', id_mapel: 4, ekstensi: 'pdf', mapel: { nama_mapel: 'Matematika' }, updated_at: '2026-11-10T00:00:00Z' } }))
  const file = new File(['%PDF'], 'bab1.pdf', { type: 'application/pdf' })
  const m = await materialApi.save({ title: 'Bab 1', classIds: [1], attachments: [{ name: 'bab1.pdf', size: 4, file }] })
  const post = calls.find((c) => c.method === 'POST' && c.path === '/mapel/4/materi')
  expect(post.init.body.get('judul')).toBe('Bab 1'); expect(post.init.body.get('file')).toBeInstanceOf(Blob)
  expect(m).toMatchObject({ id: 11, classNames: ['X IPA 1'], status: 'published' }); expect(m.attachments[0]).toMatchObject({ path: '/materi/11/file', remote: true })
  await materialApi.save({ title: 'Catatan', classIds: [1], content: 'isi teks', attachments: [] })
  const txt = calls.filter((c) => c.method === 'POST' && c.path === '/mapel/4/materi')[1].init.body.get('file')
  expect(txt.name).toBe('Catatan.txt')
})

test('assignmentApi.save: draft ditolak (backend tak punya draft); buat tugas → batas_waktu ISO UTC ke /mapel/{id}/tugas', async () => {
  seedCatalog()
  await expect(assignmentApi.save({ title: 'T', status: 'draft', classId: 1 })).rejects.toMatchObject({ status: 422 })
  route('POST', '/mapel/4/tugas', () => res(201, { data: { id_tugas: 21, judul: 'T', instruksi: 'i', batas_waktu: '2099-01-01T00:00:00Z', id_mapel: 4, status: 'terbuka' } }))
  route('GET', '/tugas/21', () => res(200, { data: { id_tugas: 21, judul: 'T', instruksi: 'i', batas_waktu: '2099-01-01T00:00:00Z', id_mapel: 4, status: 'terbuka' } }))
  const a = await assignmentApi.save({ title: ' T ', instructions: 'i', classId: 1, dueDate: '2099-01-01T07:00', status: 'published', attachments: [] })
  const body = JSON.parse(calls.find((c) => c.path === '/mapel/4/tugas').init.body)
  expect(body.judul).toBe('T'); expect(body.batas_waktu).toMatch(/^2099-01-01T\d\d:00:00\.000Z$/)
  expect(a).toMatchObject({ id: 21, status: 'published', classId: 1 })
})

test('assignmentApi.forStudent: pengumpulan_saya + /nilai/saya digabung → state missing/submitted/graded', async () => {
  seedCatalog()
  const t = (id, extra) => ({ id_tugas: id, judul: `T${id}`, instruksi: '', batas_waktu: '2099-01-01T00:00:00Z', id_mapel: 4, status: 'terbuka', ...extra })
  route('GET', '/tugas', () => page([t(1), t(2, { pengumpulan_saya: { id_pengumpulan: 50, status: 'dikumpulkan', waktu_kumpul: '2026-11-01T00:00:00Z' } }), t(3, { pengumpulan_saya: { id_pengumpulan: 51, status: 'dinilai', waktu_kumpul: '2026-11-01T00:00:00Z' } })]))
  route('GET', '/nilai/saya', () => page([{ id_nilai: 7, id_siswa: 4, id_pengumpulan: 51, sumber: 'tugas', nilai: '90', umpan_balik: 'mantap' }]))
  const rows = await assignmentApi.forStudent(4)
  expect(rows.map((r) => r.state)).toEqual(['missing', 'submitted', 'graded'])
  expect(rows[2].submission).toMatchObject({ score: 90, feedback: 'mantap' })
})

test('submissionApi.submit: jawaban teks → berkas jawaban.txt multipart; >1 berkas ditolak; kosong ditolak', async () => {
  route('POST', '/tugas/5/pengumpulan', () => res(201, { data: { id_pengumpulan: 1 } }))
  await submissionApi.submit(4, 5, { answer: 'jawabanku', attachments: [] })
  const f = calls.find((c) => c.path === '/tugas/5/pengumpulan').init.body.get('file')
  expect(f.name).toBe('jawaban.txt')
  await expect(submissionApi.submit(4, 5, { answer: '', attachments: [] })).rejects.toMatchObject({ status: 422 })
  const two = [{ name: 'a', file: new Blob(['a']) }, { name: 'b', file: new Blob(['b']) }]
  await expect(submissionApi.submit(4, 5, { attachments: two })).rejects.toMatchObject({ status: 422 })
})

test('grade: POST /pengumpulan/{id}/nilai lalu PATCH /nilai/{id} untuk perubahan; validasi 0–100; grade_exists → pesan jelas', async () => {
  route('POST', '/pengumpulan/60/nilai', () => res(201, { data: { id_nilai: 70 } }))
  route('PATCH', '/nilai/70', () => res(200, { data: { id_nilai: 70 } }))
  await teacherAssignmentApi.grade(60, { score: 80, feedback: 'ok' })
  await teacherAssignmentApi.grade(60, { score: 85, feedback: 'revisi' })
  expect(calls.filter((c) => c.path === '/pengumpulan/60/nilai')).toHaveLength(1)
  expect(JSON.parse(calls.find((c) => c.method === 'PATCH').init.body)).toEqual({ nilai: 85, umpan_balik: 'revisi' })
  await expect(teacherAssignmentApi.grade(61, { score: 101 })).rejects.toMatchObject({ status: 422 })
  route('POST', '/pengumpulan/62/nilai', () => res(409, { message: 'Sudah dinilai.', code: 'grade_exists' }))
  await expect(teacherAssignmentApi.grade(62, { score: 50 })).rejects.toMatchObject({ status: 409, code: 'grade_exists' })
})

test('scheduleApi.forStudent memakai /siswa/{id}/jadwal dan memetakan dayIndex 1–7 + HH:MM', async () => {
  route('GET', '/siswa/4/jadwal', () => page([{ id_jadwal: 1, id_kelas: 1, id_mapel: 4, id_guru: 2, waktu_mulai: '2099-01-05T01:00:00Z', waktu_selesai: '2099-01-05T02:30:00Z', durasi_menit: 90, kelas: { nama_kelas: 'X' }, mapel: { nama_mapel: 'MTK' }, guru: { id_pengguna: 2, username: 'bu.ratna' } }]))
  const [s] = await scheduleApi.forStudent(4)
  expect(s).toMatchObject({ classId: 1, subjectName: 'MTK', teacherName: 'bu.ratna', durationMin: 90 })
  expect(s.dayIndex).toBeGreaterThanOrEqual(1); expect(s.dayIndex).toBeLessThanOrEqual(7); expect(s.time).toMatch(/^\d\d:\d\d$/)
})

// ------------------------------------------------------------ Tahap 5B (admin)
test('localIso: tanggal+jam lokal → ISO dengan offset zona (backend menolak tanpa offset)', () => {
  expect(A.localIso('2026-11-16', '07:30')).toMatch(/^2026-11-16T07:30:00[+-]\d\d:\d\d$/)
  expect(A.localIso('', '07:30')).toBe('')
  expect(A.localIso('2026-11-16', '')).toBe('')
})

test('weekDays: tujuh tanggal Senin–Minggu dari tanggal mana pun dalam pekan itu', () => {
  const w = A.weekDays('2026-11-18') // Rabu
  expect(w).toHaveLength(7)
  expect(w[0]).toBe('2026-11-16'); expect(w[6]).toBe('2026-11-22')
  expect(A.weekDays('2026-11-22')[0]).toBe('2026-11-16') // Minggu masih pekan yang sama
})

test('mapRekap: hadir = hadir + terlambat; persentase dari total sesi', () => {
  const r = A.mapRekap({ id_siswa: 4, nisn: '0012345678', username: 'andi', total_sesi: 10, tercatat: 9, belum_tercatat: 1, hadir: 6, terlambat: 2, izin: 1, sakit: 0, alpa: 0 })
  expect(r).toMatchObject({ studentId: 4, name: 'andi', total: 10, h: 8, late: 2, i: 1, pending: 1, pct: 80 })
  expect(A.mapRekap({ id_siswa: 5, total_sesi: 0 }).pct).toBe(0)
})

test('conflictIds: kelas sama atau guru sama yang tumpang tindih; sesi bersebelahan tidak bentrok', () => {
  const s = (key, classId, teacherId, a, b) => ({ key, classId, teacherId, startsAt: `2026-11-16T${a}:00Z`, endsAt: `2026-11-16T${b}:00Z` })
  const bad = A.conflictIds([s('a', 1, 1, '07:00', '08:00'), s('b', 2, 1, '07:30', '08:30'), s('c', 1, 2, '08:00', '09:00'), s('d', 3, 3, '07:00', '08:00')])
  expect([...bad].sort()).toEqual(['a', 'b'])
})

test('scheduleApi.sessions: rentang dikirim sebagai dari/sampai/id_kelas dan sesi tetap bertanggal (tidak dilipat)', async () => {
  route('GET', '/jadwal', () => page([
    { id_jadwal: 1, id_kelas: 1, id_mapel: 4, id_guru: 2, waktu_mulai: '2099-01-05T01:00:00Z', waktu_selesai: '2099-01-05T02:30:00Z', kelas: { nama_kelas: 'X' }, mapel: { nama_mapel: 'MTK' }, guru: { id_pengguna: 2, username: 'bu.ratna' } },
    { id_jadwal: 2, id_kelas: 1, id_mapel: 4, id_guru: 2, waktu_mulai: '2099-01-12T01:00:00Z', waktu_selesai: '2099-01-12T02:30:00Z', kelas: { nama_kelas: 'X' }, mapel: { nama_mapel: 'MTK' }, guru: { id_pengguna: 2, username: 'bu.ratna' } },
  ]))
  const rows = await scheduleApi.sessions({ from: '2099-01-01', to: '2099-01-31', classId: 1 })
  expect(rows).toHaveLength(2)
  expect(rows[0]).toMatchObject({ key: '1', teacherName: 'bu.ratna' })
  const url = new URL(calls.find((c) => c.path === '/jadwal').url, 'http://x')
  expect(url.searchParams.get('dari')).toBe('2099-01-01'); expect(url.searchParams.get('sampai')).toBe('2099-01-31'); expect(url.searchParams.get('id_kelas')).toBe('1')
})

test('scheduleApi.create/update/remove: body backend (id_kelas, id_mapel, waktu ISO+offset); validasi jam sebelum dikirim', async () => {
  route('POST', '/jadwal', () => res(201, { data: { id_jadwal: 9, id_kelas: 1, id_mapel: 4, id_guru: 2, waktu_mulai: '2099-01-05T01:00:00Z', waktu_selesai: '2099-01-05T02:00:00Z' } }))
  await scheduleApi.create({ classId: '1', subjectId: '4', teacherId: '', date: '2099-01-05', start: '08:00', end: '09:00' })
  const post = JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/jadwal').init.body)
  expect(post).toMatchObject({ id_kelas: 1, id_mapel: 4 })
  expect(post.id_guru).toBeUndefined()
  expect(post.waktu_mulai).toMatch(/^2099-01-05T08:00:00[+-]\d\d:\d\d$/)
  const n = calls.length
  await expect(scheduleApi.create({ classId: 1, subjectId: 4, date: '2099-01-05', start: '09:00', end: '08:00' })).rejects.toMatchObject({ status: 422 })
  await expect(scheduleApi.create({ classId: 1 })).rejects.toMatchObject({ status: 422 })
  expect(calls.length).toBe(n) // tidak ada permintaan jaringan untuk input tak valid
  route('PATCH', '/jadwal/9', () => res(200, { data: { id_jadwal: 9, id_kelas: 1, id_mapel: 4, id_guru: 3, waktu_mulai: '2099-01-05T01:00:00Z', waktu_selesai: '2099-01-05T02:00:00Z' } }))
  await scheduleApi.update(9, { teacherId: 3 })
  expect(JSON.parse(calls.find((c) => c.method === 'PATCH').init.body)).toEqual({ id_guru: 3 })
  route('DELETE', '/jadwal/9', () => res(204, null))
  expect(await scheduleApi.remove(9)).toBe(true)
  routes.length = 0 // buang handler lama agar yang berikut dipakai
  route('POST', '/jadwal', () => res(409, { message: 'Guru sudah mengajar pada jam itu.', code: 'teacher_schedule_conflict' }))
  await expect(scheduleApi.create({ classId: 1, subjectId: 4, date: '2099-01-05', start: '08:00', end: '09:00' })).rejects.toMatchObject({ status: 409, code: 'teacher_schedule_conflict' })
})

test('attendanceApi (admin): roster per sesi, koreksi pakai PATCH bila sudah ada presensi, POST bila belum; rekap /rekap/presensi', async () => {
  route('GET', '/jadwal/7/presensi', () => page([
    { id_siswa: 4, username: 'andi', nisn: '1', status_kehadiran: 'hadir', presensi: { id_presensi: 55 } },
    { id_siswa: 5, username: 'budi', nisn: '2', status_kehadiran: 'belum_tercatat', presensi: null },
  ]))
  const { records, stats } = await attendanceApi.roster(7)
  expect(records.map((r) => r.status)).toEqual(['H', 'A']); expect(stats.total).toBe(2)
  route('PATCH', '/presensi/55', () => res(200, { data: {} }))
  route('POST', '/jadwal/7/presensi', () => res(201, { data: {} }))
  await attendanceApi.correct(7, 4, 'S')
  expect(JSON.parse(calls.find((c) => c.method === 'PATCH' && c.path === '/presensi/55').init.body)).toEqual({ status_kehadiran: 'sakit' })
  await attendanceApi.correct(7, 5, 'I')
  expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/jadwal/7/presensi').init.body)).toEqual({ id_siswa: 5, status_kehadiran: 'izin' })
  route('GET', '/rekap/presensi', () => page([{ id_siswa: 4, username: 'andi', nisn: '1', total_sesi: 4, tercatat: 4, belum_tercatat: 0, hadir: 3, terlambat: 0, izin: 1, sakit: 0, alpa: 0 }]))
  const rek = await attendanceApi.rekap({ classId: 1, from: '2026-11-01', to: '2026-11-13' })
  expect(rek[0]).toMatchObject({ name: 'andi', pct: 75 })
  const url = new URL(calls.find((c) => c.path === '/rekap/presensi').url, 'http://x')
  expect(url.searchParams.get('dari')).toBe('2026-11-01'); expect(url.searchParams.get('sampai')).toBe('2026-11-13'); expect(url.searchParams.get('id_kelas')).toBe('1')
})

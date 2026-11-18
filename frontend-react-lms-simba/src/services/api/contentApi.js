import { apiRequest, fetchAll, apiDownload, saveBlob, ApiError } from '../http'
import { loadCatalog, invalidateCatalog } from './catalog'
import * as A from './adapt'

const invalid = (message, errors) => new ApiError(message, { status: 422, code: 'validasi_gagal', errors })
const gone = async (fn) => { try { return await fn() } catch (e) { if (e?.status === 404 || e?.status === 403) return null; throw e } }
const byId = (rows, key) => new Map(rows.map((r) => [Number(r[key]), r]))

// Indeks id_pengumpulan → id_nilai, diisi setiap kali daftar nilai dibaca; dipakai agar "beri nilai" tahu memakai POST (baru) atau PATCH (ubah).
const nilaiIndex = new Map()
const remember = (nilai) => nilai.forEach((n) => { if (n.id_pengumpulan) nilaiIndex.set(Number(n.id_pengumpulan), Number(n.id_nilai)) })

// ---------------------------------------------------------------- Berkas (unduh ber-otorisasi)
export const fileApi = {
  async download(att) {
    if (!att?.path) throw invalid('Berkas ini belum tersimpan di server.')
    const { blob, filename } = await apiDownload(att.path, att.name)
    saveBlob(blob, filename || att.name)
    return true
  },
}

// Guru memilih kelas di formulir, tetapi backend mengikat materi/tugas ke MAPEL. Mapel ditentukan dari jadwal: mapel yang
// diampu pemanggil dan diajarkan di kelas itu (bila ada beberapa, dipakai yang pertama).
export async function resolveMapelId({ classId, subjectId } = {}) {
  if (subjectId) return Number(subjectId)
  const cat = await loadCatalog()
  const mine = new Set(cat.mapel.map((m) => Number(m.id_mapel)))
  const cand = cat.rel.mapelIdsOfClass(classId).filter((id) => mine.has(id))
  if (cand.length) return cand[0]
  if (cat.mapel.length === 1) return Number(cat.mapel[0].id_mapel)
  throw invalid('Kelas ini belum punya jadwal untuk mapel yang Anda ampu. Minta admin menambahkan jadwal terlebih dahulu.')
}

// ---------------------------------------------------------------- Materi
const allMaterials = async () => {
  const cat = await loadCatalog()
  const lists = await Promise.all(cat.mapel.map((m) => fetchAll(`/mapel/${m.id_mapel}/materi`).catch(() => [])))
  return lists.flat().map((m) => A.mapMaterial(m, cat.rel)).sort((a, b) => b.id - a.id)
}
const fileOf = (attachments) => (attachments ?? []).find((a) => a?.file instanceof Blob)?.file ?? null

export const materialApi = {
  list: allMaterials,
  get: (id) => gone(async () => { const cat = await loadCatalog(); return A.mapMaterial(A.item(await apiRequest(`/materi/${id}`)), cat.rel) }),
  forStudent: () => allMaterials(),
  getForStudent: (uid, id) => materialApi.get(id),
  async save(data) {
    const judul = String(data.title ?? '').trim()
    if (data.id) {
      const m = A.item(await apiRequest(`/materi/${data.id}`, { method: 'PATCH', body: { judul } }))
      const f = fileOf(data.attachments)
      if (f) { const fd = new FormData(); fd.append('file', f); await apiRequest(`/materi/${data.id}/file`, { method: 'POST', body: fd }) }
      invalidateCatalog(); return materialApi.get(m.id_materi)
    }
    // Backend mewajibkan satu berkas. Materi tanpa lampiran tetapi berisi teks disimpan sebagai berkas .txt.
    const file = fileOf(data.attachments) ?? (String(data.content ?? '').trim() ? new File([data.content], `${judul || 'materi'}.txt`, { type: 'text/plain' }) : null)
    if (!file) throw invalid('Pilih berkas materi (atau isi teks materi).')
    const idMapel = await resolveMapelId({ classId: data.classIds?.[0], subjectId: data.subjectId })
    const fd = new FormData(); fd.append('judul', judul); fd.append('file', file)
    const created = A.item(await apiRequest(`/mapel/${idMapel}/materi`, { method: 'POST', body: fd }))
    invalidateCatalog(); return materialApi.get(created.id_materi)
  },
  async remove(id) { await apiRequest(`/materi/${id}`, { method: 'DELETE' }); return true },
  move: () => Promise.reject(new ApiError('Mengurutkan materi belum didukung oleh backend.', { status: 501, code: 'belum_didukung' })),
}

// ---------------------------------------------------------------- Tugas
const rawTugas = () => fetchAll('/tugas')
const mapA = (t, cat, extra) => A.mapAssignment(t, { ...cat.rel, ...extra })

const nilaiMine = () => fetchAll('/nilai/saya').catch(() => [])
function studentView(t, cat, nilaiByPengumpulan, uid) {
  const a = mapA(t, cat)
  const p = t.pengumpulan_saya
  if (!p) return { ...a, submission: null, state: 'missing' }
  const n = nilaiByPengumpulan.get(Number(p.id_pengumpulan))
  const sub = A.mapSubmission({ ...p, id_tugas: t.id_tugas, id_siswa: uid, tugas: { batas_waktu: t.batas_waktu } }, n, t)
  return { ...a, submission: sub, state: sub.status === 'graded' ? 'graded' : 'submitted' }
}

export const assignmentApi = {
  async list() { const [t, cat] = await Promise.all([rawTugas(), loadCatalog()]); return t.map((x) => mapA(x, cat)) },
  get: (id) => gone(async () => { const cat = await loadCatalog(); return mapA(A.item(await apiRequest(`/tugas/${id}`)), cat) }),
  async forStudent(uid) {
    const [t, nilai, cat] = await Promise.all([rawTugas(), nilaiMine(), loadCatalog()])
    remember(nilai)
    const idx = new Map(nilai.filter((n) => n.id_pengumpulan).map((n) => [Number(n.id_pengumpulan), n]))
    return t.map((x) => studentView(x, cat, idx, uid))
  },
  getForStudent: (uid, id) => gone(async () => {
    const [t, nilai, cat] = await Promise.all([apiRequest(`/tugas/${id}`), nilaiMine(), loadCatalog()])
    remember(nilai)
    const idx = new Map(nilai.filter((n) => n.id_pengumpulan).map((n) => [Number(n.id_pengumpulan), n]))
    return studentView(A.item(t), cat, idx, uid)
  }),
  async save(data) {
    if (data.status === 'draft') throw invalid('Draf tugas belum didukung backend: tugas langsung terbit untuk siswa. Ubah status menjadi "Dipublikasikan" untuk melanjutkan.')
    const body = { judul: String(data.title ?? '').trim(), instruksi: String(data.instructions ?? ''), batas_waktu: A.fromLocalInput(data.dueDate) }
    const f = fileOf(data.attachments)
    let t
    if (data.id) t = A.item(await apiRequest(`/tugas/${data.id}`, { method: 'PATCH', body }))
    else {
      const idMapel = await resolveMapelId({ classId: data.classId, subjectId: data.subjectId })
      t = A.item(await apiRequest(`/mapel/${idMapel}/tugas`, { method: 'POST', body }))
    }
    if (f) { const fd = new FormData(); fd.append('lampiran', f); await apiRequest(`/tugas/${t.id_tugas}/lampiran`, { method: 'POST', body: fd }) }
    invalidateCatalog()
    return assignmentApi.get(t.id_tugas)
  },
  async setStatus(id, status) {
    if (status === 'archived') { await apiRequest(`/tugas/${id}/tutup`, { method: 'POST' }); return true }
    if (status === 'published') throw new ApiError('Membuka kembali tugas yang sudah ditutup belum didukung backend.', { status: 409, code: 'belum_didukung' })
    throw invalid('Status tidak valid.')
  },
  async remove(id) { await apiRequest(`/tugas/${id}`, { method: 'DELETE' }); return true },
}

// ---------------------------------------------------------------- Pengumpulan & nilai
async function submissionsOf(rawTask) {
  const [subs, nilai] = await Promise.all([fetchAll(`/tugas/${rawTask.id_tugas}/pengumpulan`), fetchAll('/nilai', { id_tugas: rawTask.id_tugas }).catch(() => [])])
  remember(nilai)
  const idx = new Map(nilai.filter((n) => n.id_pengumpulan).map((n) => [Number(n.id_pengumpulan), n]))
  return subs.map((p) => A.mapSubmission(p, idx.get(Number(p.id_pengumpulan)), rawTask))
}

function gradeSubmission() {
  return async (submissionId, { score, feedback }) => {
    const n = Number(score)
    if (score === '' || score === null || score === undefined || !Number.isFinite(n) || n < 0 || n > 100) throw invalid('Nilai harus antara 0 dan 100.')
    const body = { nilai: n, umpan_balik: feedback ?? '' }
    const nid = nilaiIndex.get(Number(submissionId))
    if (nid) { await apiRequest(`/nilai/${nid}`, { method: 'PATCH', body }); return true }
    try {
      const r = A.item(await apiRequest(`/pengumpulan/${submissionId}/nilai`, { method: 'POST', body }))
      if (r?.id_nilai) nilaiIndex.set(Number(submissionId), Number(r.id_nilai))
    } catch (e) {
      if (e?.code === 'grade_exists') throw new ApiError('Pengumpulan ini sudah pernah dinilai. Muat ulang halaman, lalu ubah nilainya.', { status: 409, code: e.code, requestId: e.requestId })
      throw e
    }
    return true
  }
}

export const submissionApi = {
  async list(assignmentId) {
    if (assignmentId !== undefined) { const t = await apiRequest(`/tugas/${assignmentId}`); return submissionsOf(A.item(t)) }
    return (await Promise.all((await rawTugas()).map(submissionsOf))).flat()
  },
  async mine(uid) {
    const [subs, nilai, tugas] = await Promise.all([fetchAll('/pengumpulan/saya'), nilaiMine(), rawTugas()])
    remember(nilai)
    const idx = new Map(nilai.filter((n) => n.id_pengumpulan).map((n) => [Number(n.id_pengumpulan), n]))
    const tb = byId(tugas, 'id_tugas')
    return subs.map((p) => A.mapSubmission({ ...p, id_siswa: uid }, idx.get(Number(p.id_pengumpulan)), tb.get(Number(p.id_tugas))))
  },
  async submit(uid, assignmentId, { answer = '', attachments = [] } = {}) {
    if (attachments.length > 1) throw invalid('Backend menerima satu berkas per pengumpulan. Gabungkan jawaban Anda menjadi satu berkas.')
    const file = fileOf(attachments) ?? (answer.trim() ? new File([answer], 'jawaban.txt', { type: 'text/plain' }) : null)
    if (!file) throw invalid('Isi jawaban atau pilih lampiran.')
    const fd = new FormData(); fd.append('file', file)
    await apiRequest(`/tugas/${assignmentId}/pengumpulan`, { method: 'POST', body: fd })
    return true
  },
  grade: gradeSubmission(),
}

export const gradeApi = {
  async list() { const [n, cat] = await Promise.all([fetchAll('/nilai'), loadCatalog()]); return n.map((x) => A.mapGrade(x, cat.rel)) },
  async forStudent() { const [n, cat] = await Promise.all([fetchAll('/nilai/saya'), loadCatalog()]); remember(n); return n.map((x) => A.mapGrade(x, cat.rel)) },
  async summary() {
    const rows = await gradeApi.list()
    return { count: rows.length, average: A.avg1(rows.map((r) => r.score)), highest: rows.length ? Math.max(...rows.map((r) => r.score)) : null }
  },
}

// ---------------------------------------------------------------- Fasad guru & siswa (bentuk data khusus halaman)
export const teacherApi = {
  async listClasses() {
    const [kelas, cat] = await Promise.all([fetchAll('/kelas'), loadCatalog()])
    return Promise.all(kelas.map(async (k) => {
      const members = await fetchAll(`/kelas/${k.id_kelas}/anggota`).catch(() => [])
      const students = members.map(A.mapUser)
      const subjects = cat.rel.subjectsOfClass(k.id_kelas)
      return { id: Number(k.id_kelas), classId: Number(k.id_kelas), name: k.nama_kelas, subject: subjects.join(', ') || '-', year: '-', status: k.aktif === false ? 'finished' : 'active', studentIds: students.map((s) => s.id), students, teacherId: undefined }
    }))
  },
  async getClass(id) {
    const all = await teacherApi.listClasses()
    const c = all.find((x) => x.id === Number(id))
    if (!c) return null
    const mats = (await allMaterials()).filter((m) => m.classIds.includes(c.id))
    return { ...c, materials: mats }
  },
  async classOptions() { const cat = await loadCatalog(); return cat.kelas.filter((k) => k.aktif !== false).map((k) => ({ id: Number(k.id_kelas), name: k.nama_kelas })) },
  async materialsOverview() {
    const [items, options, cat] = await Promise.all([allMaterials(), teacherApi.classOptions(), loadCatalog()])
    const reached = new Set(items.flatMap((m) => m.classIds))
    const reach = cat.kelas.filter((k) => reached.has(Number(k.id_kelas))).reduce((s, k) => s + (k.jumlah_siswa ?? 0), 0)
    return { items, reach, classOptions: options }
  },
  listMaterials: allMaterials,
  getMaterial: (id) => materialApi.get(id),
  saveMaterial: (d) => materialApi.save(d),
  deleteMaterial: (id) => materialApi.remove(id),
  moveMaterial: (id, dir) => materialApi.move(id, dir),
}

export const teacherAssignmentApi = {
  async list() {
    const [t, cat] = await Promise.all([rawTugas(), loadCatalog()])
    const size = (idMapel) => cat.rel.classIdsOfMapel(idMapel).reduce((s, c) => s + (cat.kelas.find((k) => Number(k.id_kelas) === c)?.jumlah_siswa ?? 0), 0)
    return t.map((x) => ({ ...mapA(x, cat), submitted: x.jumlah_pengumpulan ?? 0, total: size(x.id_mapel) }))
  },
  async gradingOverview(classId) {
    const [t, cat] = await Promise.all([rawTugas(), loadCatalog()])
    const mine = t.filter((x) => cat.rel.classIdsOfMapel(x.id_mapel).includes(Number(classId))).sort((a, b) => String(a.batas_waktu).localeCompare(String(b.batas_waktu)))
    const subs = (await Promise.all(mine.map(submissionsOf))).flat()
    const onTime = subs.filter((s) => !s.late).length
    return { assignments: mine.map((x) => mapA(x, cat, { classId: Number(classId) })), pending: subs.filter((s) => s.status === 'submitted').length, onTimePct: subs.length ? Math.round((onTime / subs.length) * 1000) / 10 : null }
  },
  get: (id) => assignmentApi.get(id),
  save: (d) => assignmentApi.save(d),
  setStatus: (id, s) => assignmentApi.setStatus(id, s),
  remove: (id) => assignmentApi.remove(id),
  grade: gradeSubmission(),
  async roster(id) {
    const raw = await gone(async () => A.item(await apiRequest(`/tugas/${id}`)))
    if (!raw) return null
    const cat = await loadCatalog()
    const classIds = cat.rel.classIdsOfMapel(raw.id_mapel)
    const [subs, members] = await Promise.all([submissionsOf(raw), Promise.all(classIds.map((c) => fetchAll(`/kelas/${c}/anggota`).catch(() => [])))])
    const subBy = new Map(subs.map((s) => [s.studentId, s]))
    const rows = members.flat().map(A.mapUser).filter((u) => u.role === 'student').map((u) => {
      const s = subBy.get(u.id)
      return { id: u.id, name: u.name, nisn: u.nisn ?? '-', submission: s ?? null, state: !s ? 'missing' : s.status === 'graded' ? 'graded' : 'submitted' }
    })
    return { assignment: mapA(raw, cat), rows }
  },
  async recap() {
    const [t, cat] = await Promise.all([rawTugas(), loadCatalog()])
    const lists = await Promise.all(t.map(async (x) => (await submissionsOf(x)).map((s) => ({ s, x }))))
    return lists.flat().map(({ s, x }) => {
      const classId = cat.rel.classIdsOfMapel(x.id_mapel)[0]
      return { id: s.id, studentName: s.studentName ?? '-', classId, className: cat.rel.className(classId) ?? '-', assignmentId: Number(x.id_tugas), assignmentTitle: x.judul, status: s.status, score: s.score, late: s.late }
    })
  },
}

export const studentApi = {
  listAssignments: (uid) => assignmentApi.forStudent(uid),
  getAssignment: (uid, id) => assignmentApi.getForStudent(uid, id),
  submit: (uid, id, d) => submissionApi.submit(uid, id, d),
  listGrades: (uid) => gradeApi.forStudent(uid),
  async listSubjects() {
    const [cat, tugas, mats] = await Promise.all([loadCatalog(), rawTugas(), allMaterials()])
    return cat.mapel.map((m) => {
      const classId = cat.rel.classIdsOfMapel(m.id_mapel)[0]
      return {
        id: Number(m.id_mapel), name: m.nama_mapel, code: A.codeOf(m.nama_mapel), teacherName: m.guru?.username ?? cat.rel.teacherName(m.id_guru) ?? '-', classId, className: cat.rel.className(classId) ?? '-',
        materialCount: mats.filter((x) => x.subjectId === Number(m.id_mapel)).length,
        openAssignments: tugas.filter((t) => Number(t.id_mapel) === Number(m.id_mapel) && t.status === 'terbuka' && !t.pengumpulan_saya).length,
      }
    })
  },
}

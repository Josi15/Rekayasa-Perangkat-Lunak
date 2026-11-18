import { apiRequest, fetchAll, ApiError } from '../http'
import { invalidateCatalog, loadCatalog } from './catalog'
import { mapUser, mapClass, mapSubject, userPayload, item } from './adapt'

const notFoundToNull = async (fn) => { try { return await fn() } catch (e) { if (e?.status === 404 || e?.status === 403) return null; throw e } }
const invalid = (message, errors) => new ApiError(message, { status: 422, code: 'validasi_gagal', errors })

// ---------------------------------------------------------------- Pengguna (admin)
const setStatus = async (id, status) => {
  const aksi = status === 'active' ? 'aktifkan' : 'nonaktifkan' // 'pending' diperlakukan sebagai nonaktif (backend hanya aktif/nonaktif)
  return mapUser(item(await apiRequest(`/admin/pengguna/${id}/${aksi}`, { method: 'POST' })))
}

export const userApi = {
  list: async () => (await fetchAll('/admin/pengguna')).map(mapUser),
  get: (id) => notFoundToNull(async () => mapUser(item(await apiRequest(`/admin/pengguna/${id}`)))),
  async create(d) {
    const u = mapUser(item(await apiRequest('/admin/pengguna', { method: 'POST', body: userPayload(d, { creating: true }) })))
    invalidateCatalog()
    return d.status && d.status !== 'active' ? setStatus(u.id, 'inactive') : u
  },
  async update(id, d, actorId) {
    const cur = await userApi.get(id)
    if (!cur) throw new ApiError('Pengguna tidak ditemukan.', { status: 404 })
    if (d.role && d.role !== cur.role) throw invalid('Peran tidak dapat diubah setelah akun dibuat. Buat akun baru bila perlu.')
    if (cur.id === Number(actorId) && d.status && d.status !== 'active') throw invalid('Anda tidak dapat menonaktifkan akun sendiri.')
    const body = userPayload({ ...d, role: cur.role }, { creating: false })
    const u = Object.keys(body).length ? mapUser(item(await apiRequest(`/admin/pengguna/${id}`, { method: 'PATCH', body }))) : cur
    invalidateCatalog()
    const want = d.status === 'active' ? 'active' : d.status ? 'inactive' : u.status
    return want !== u.status ? setStatus(id, want) : u
  },
  async setStatus(id, status, actorId) {
    if (Number(id) === Number(actorId) && status !== 'active') throw invalid('Anda tidak dapat menonaktifkan akun sendiri.')
    const u = await setStatus(id, status); invalidateCatalog(); return u
  },
}

// ---------------------------------------------------------------- Kelas
export const classApi = {
  async list() {
    const [kelas, cat] = await Promise.all([fetchAll('/kelas'), loadCatalog()])
    return kelas.map((k) => mapClass(k, cat.rel))
  },
  get: (id) => notFoundToNull(async () => {
    const [k, anggota, cat] = await Promise.all([apiRequest(`/kelas/${id}`), fetchAll(`/kelas/${id}/anggota`).catch(() => []), loadCatalog()])
    return { ...mapClass(item(k), cat.rel), studentIds: anggota.map((a) => Number(a.id_pengguna)) }
  }),
  async create(d) {
    const k = await apiRequest('/kelas', { method: 'POST', body: { nama_kelas: String(d.name ?? '').trim(), id_wali: Number(d.homeroomId) } })
    invalidateCatalog(); return mapClass(item(k))
  },
  async update(id, d) {
    const cur = await classApi.get(id)
    if (!cur) throw new ApiError('Kelas tidak ditemukan.', { status: 404 })
    if (d.name !== undefined && String(d.name).trim() !== cur.name) await apiRequest(`/kelas/${id}`, { method: 'PATCH', body: { nama_kelas: String(d.name).trim() } })
    if (d.homeroomId !== undefined && Number(d.homeroomId) !== cur.homeroomId) await apiRequest(`/kelas/${id}/wali`, { method: 'PUT', body: { id_wali: Number(d.homeroomId) } })
    invalidateCatalog(); return classApi.get(id)
  },
  async setStatus(id, status) {
    const r = await apiRequest(`/kelas/${id}/${status === 'archived' ? 'arsipkan' : 'pulihkan'}`, { method: 'POST' })
    invalidateCatalog(); return mapClass(item(r))
  },
}

// ---------------------------------------------------------------- Mata pelajaran
export const subjectApi = {
  async list() {
    const [mapel, cat] = await Promise.all([fetchAll('/mapel'), loadCatalog()])
    return mapel.map((m) => mapSubject(m, cat.rel))
  },
  get: (id) => notFoundToNull(async () => { const cat = await loadCatalog(); return mapSubject(item(await apiRequest(`/mapel/${id}`)), cat.rel) }),
  async create(d) { // `code` tidak ada di backend → diabaikan
    const r = await apiRequest('/mapel', { method: 'POST', body: { nama_mapel: String(d.name ?? '').trim(), id_guru: Number(d.teacherId) } })
    invalidateCatalog(); return mapSubject(item(r))
  },
  async update(id, d) {
    const cur = await subjectApi.get(id)
    if (!cur) throw new ApiError('Mata pelajaran tidak ditemukan.', { status: 404 })
    if (d.name !== undefined && String(d.name).trim() !== cur.name) await apiRequest(`/mapel/${id}`, { method: 'PATCH', body: { nama_mapel: String(d.name).trim() } })
    if (d.teacherId !== undefined && Number(d.teacherId) !== cur.teacherId) await apiRequest(`/mapel/${id}/guru`, { method: 'PUT', body: { id_guru: Number(d.teacherId) } })
    invalidateCatalog(); return subjectApi.get(id)
  },
  async setStatus(id, status) {
    const r = await apiRequest(`/mapel/${id}/${status === 'archived' ? 'arsipkan' : 'pulihkan'}`, { method: 'POST' })
    invalidateCatalog(); return mapSubject(item(r))
  },
}

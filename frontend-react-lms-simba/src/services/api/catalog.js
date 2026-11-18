import { fetchAll } from '../http'
import { nameOf } from './adapt'

// Katalog relasi (mapel ↔ kelas ↔ guru) untuk pengguna yang sedang login. Backend tidak menyimpan relasi kelas-mapel
// langsung: hubungannya lewat JADWAL (id_kelas + id_mapel). Data dibatasi backend sesuai peran (siswa: kelasnya, dst.).
// Cache singkat + berbagi promise agar satu layar tidak memicu puluhan permintaan identik.
let pending = null
let at = 0
const TTL_MS = 15000
export const invalidateCatalog = () => { pending = null }

// Kegagalan non-401 pada satu sumber tidak menggagalkan seluruh halaman (sumber itu dianggap kosong).
const safe = async (p) => { try { return await p } catch (e) { if (e?.status === 401) throw e; return [] } }
const add = (map, k, v) => { const key = Number(k); if (!map.has(key)) map.set(key, new Set()); map.get(key).add(Number(v)) }

export function buildCatalog({ mapel = [], jadwal = [], kelas = [] }) {
  const classesOfMapel = new Map(), mapelOfClass = new Map(), people = new Map()
  for (const j of jadwal) { add(classesOfMapel, j.id_mapel, j.id_kelas); add(mapelOfClass, j.id_kelas, j.id_mapel) }
  const person = (u) => { if (u?.id_pengguna) people.set(Number(u.id_pengguna), nameOf(u)) }
  mapel.forEach((m) => person(m.guru)); kelas.forEach((k) => person(k.wali)); jadwal.forEach((j) => person(j.guru))
  const mapelBy = new Map(mapel.map((m) => [Number(m.id_mapel), m]))
  const kelasBy = new Map(kelas.map((k) => [Number(k.id_kelas), k]))
  // Nama mapel/kelas juga bisa datang dari jadwal bila /mapel atau /kelas tidak memuatnya.
  jadwal.forEach((j) => { if (j.mapel && !mapelBy.has(Number(j.id_mapel))) mapelBy.set(Number(j.id_mapel), { id_mapel: j.id_mapel, nama_mapel: j.mapel.nama_mapel }); if (j.kelas && !kelasBy.has(Number(j.id_kelas))) kelasBy.set(Number(j.id_kelas), { id_kelas: j.id_kelas, nama_kelas: j.kelas.nama_kelas }) })
  const rel = {
    classIdsOfMapel: (id) => [...(classesOfMapel.get(Number(id)) ?? [])],
    mapelIdsOfClass: (id) => [...(mapelOfClass.get(Number(id)) ?? [])],
    subjectsOfClass: (id) => [...(mapelOfClass.get(Number(id)) ?? [])].map((m) => mapelBy.get(m)?.nama_mapel).filter(Boolean),
    subjectName: (id) => mapelBy.get(Number(id))?.nama_mapel,
    className: (id) => kelasBy.get(Number(id))?.nama_kelas,
    teacherName: (id) => people.get(Number(id)),
  }
  return { mapel, jadwal, kelas, rel }
}

export function loadCatalog() {
  if (pending && Date.now() - at < TTL_MS) return pending
  at = Date.now()
  const p = (async () => {
    const [mapel, jadwal, kelas] = await Promise.all([safe(fetchAll('/mapel')), safe(fetchAll('/jadwal')), safe(fetchAll('/kelas'))])
    return buildCatalog({ mapel, jadwal, kelas })
  })()
  pending = p
  p.catch(() => { if (pending === p) pending = null })
  return p
}

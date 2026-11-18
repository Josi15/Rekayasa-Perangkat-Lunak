// Lapisan adaptasi: mengubah bentuk respons backend Laravel (nama field Indonesia, {data,meta,links}) menjadi
// bentuk yang dipakai halaman (field Inggris, status 'active'/'archived', dst.) dan sebaliknya.
// Semua fungsi di sini MURNI (tanpa jaringan) agar mudah diuji. Sumber kontrak: Resource class + FormRequest backend.

// ---- Enum -------------------------------------------------------------------------------------
export const ROLE_IN = { siswa: 'student', guru: 'teacher', admin: 'admin' }
export const ROLE_OUT = { student: 'siswa', teacher: 'guru', admin: 'admin' }
// status_kehadiran backend ↔ kode ringkas yang dipakai halaman presensi (H/I/S/A). 'terlambat' dihitung hadir.
export const ATT_IN = { hadir: 'H', terlambat: 'H', izin: 'I', sakit: 'S', alpa: 'A', belum_tercatat: 'A' }
export const ATT_OUT = { H: 'hadir', I: 'izin', S: 'sakit', A: 'alpa' }

const num = (v) => (v === undefined || v === null || v === '' ? v : Number(v))
export const list = (r) => r?.data ?? []
export const item = (r) => r?.data ?? null

// ---- Pengguna ---------------------------------------------------------------------------------
// Backend TIDAK punya kolom nama lengkap (hanya username/NISN/NIP/email). Nama tampilan diturunkan dari identitas yang ada.
export const nameOf = (u) => u?.username || u?.nisn || u?.nip || (u?.email ? String(u.email).split('@')[0] : '') || (u?.id_pengguna ? `Pengguna ${u.id_pengguna}` : '-')

export const mapUser = (u) => ({
  id: num(u.id_pengguna), name: nameOf(u), email: u.email ?? '', username: u.username ?? '',
  role: ROLE_IN[u.peran] ?? u.peran, status: u.aktif === false ? 'inactive' : 'active',
  ...(u.nisn ? { nisn: u.nisn } : {}), ...(u.nip ? { nip: u.nip } : {}),
})

// Payload pembuatan pengguna. Identitas login wajib sesuai peran: siswa=NISN (10 digit), guru=NIP (18 digit), admin=username.
export function userPayload(d, { creating }) {
  const out = {}
  if (creating) out.peran = ROLE_OUT[d.role] ?? d.role
  const peran = creating ? out.peran : ROLE_OUT[d.role] ?? d.role
  const put = (k, v) => { if (v !== undefined && v !== null && String(v).trim() !== '') out[k] = String(v).trim() }
  if (peran === 'siswa') put('nisn', d.nisn)
  if (peran === 'guru') put('nip', d.nip)
  if (peran === 'admin' || (d.username ?? '') !== '') put('username', d.username)
  if (creating || d.email !== undefined) { const e = String(d.email ?? '').trim(); if (e || creating) out.email = e || null }
  if (d.password) out.password = d.password
  return out
}

// ---- Kelas & mapel ----------------------------------------------------------------------------
export const mapClass = (k, rel = {}) => ({
  id: num(k.id_kelas), name: k.nama_kelas, homeroomId: num(k.id_wali), homeroom: k.wali?.username ?? rel.teacherName?.(k.id_wali) ?? '-',
  size: k.jumlah_siswa ?? 0, enrolled: k.jumlah_siswa ?? 0, studentIds: [],
  status: k.aktif === false ? 'archived' : 'active',
  subjects: rel.subjectsOfClass?.(num(k.id_kelas)) ?? [],
})

// Backend tidak punya kode mapel; tampilkan singkatan dari nama (hanya tampilan, tidak dikirim balik).
export const codeOf = (name) => {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  const raw = words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] ?? '').slice(0, 3)
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export const mapSubject = (m, rel = {}) => ({
  id: num(m.id_mapel), name: m.nama_mapel, code: codeOf(m.nama_mapel), teacherId: num(m.id_guru),
  teacherName: m.guru?.username ?? rel.teacherName?.(m.id_guru) ?? '-',
  status: m.aktif === false ? 'archived' : 'active',
  classCount: rel.classIdsOfMapel?.(num(m.id_mapel))?.length ?? 0,
})

// ---- Waktu ------------------------------------------------------------------------------------
const p2 = (n) => String(n).padStart(2, '0')
// ISO-8601 (dengan offset) → nilai <input type="datetime-local"> di zona waktu peramban.
export const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}` }
// Nilai datetime-local (zona peramban) → ISO UTC untuk dikirim ke backend.
export const fromLocalInput = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? v : d.toISOString() }
export const dayIndexOf = (iso) => new Date(iso).getDay() // 0=Minggu … 6=Sabtu (zona peramban)
export const hhmm = (iso) => { const d = new Date(iso); return `${p2(d.getHours())}:${p2(d.getMinutes())}` }

// ---- Materi -----------------------------------------------------------------------------------
export const mapMaterial = (m, rel = {}) => {
  const idMapel = num(m.id_mapel)
  const classIds = rel.classIdsOfMapel?.(idMapel) ?? []
  const ext = (m.ekstensi ?? '').toLowerCase()
  return {
    id: num(m.id_materi), title: m.judul, description: '', content: '', status: 'published',
    subjectId: idMapel, subjectName: m.mapel?.nama_mapel ?? rel.subjectName?.(idMapel) ?? '-',
    classIds, classNames: classIds.map((c) => rel.className?.(c) ?? '-'),
    // Satu berkas per materi. Ukuran tidak dikirim backend → 0 (UI menyembunyikan ukuran 0).
    attachments: [{ name: ext ? `${m.judul}.${ext}` : String(m.judul), size: 0, path: `/materi/${m.id_materi}/file`, remote: true }],
    order: num(m.id_materi), updatedAt: String(m.updated_at ?? m.created_at ?? '').slice(0, 10),
  }
}

// ---- Tugas & pengumpulan ----------------------------------------------------------------------
export const mapAssignment = (t, rel = {}) => {
  const idMapel = num(t.id_mapel)
  const classIds = rel.classIdsOfMapel?.(idMapel) ?? []
  const classId = rel.classId ?? classIds[0]
  return {
    id: num(t.id_tugas), title: t.judul, instructions: t.instruksi ?? '', dueDate: t.batas_waktu,
    // Backend hanya mengenal "terbuka"/"tertutup" (tidak ada draft): terbuka=published, tertutup=archived.
    status: t.status === 'terbuka' ? 'published' : 'archived',
    subjectId: idMapel, subjectName: t.mapel?.nama_mapel ?? rel.subjectName?.(idMapel) ?? '-',
    classId, classIds, className: rel.className?.(classId) ?? '-',
    attachments: t.punya_lampiran ? [{ name: 'Lampiran tugas', size: 0, path: `/tugas/${t.id_tugas}/lampiran`, remote: true }] : [],
    submittedCount: t.jumlah_pengumpulan,
  }
}

// Pengumpulan + nilai (nilai berada di resource terpisah /nilai, digabung lewat id_pengumpulan).
export const mapSubmission = (p, nilai, assignment) => {
  const graded = p.status === 'dinilai' || !!nilai
  const due = assignment?.batas_waktu ?? p.tugas?.batas_waktu
  const late = p.terlambat === true || p.status === 'terlambat' || (due ? new Date(p.waktu_kumpul) > new Date(due) : false)
  return {
    id: num(p.id_pengumpulan), assignmentId: num(p.id_tugas), studentId: num(p.id_siswa),
    studentName: p.siswa ? nameOf(p.siswa) : undefined, nisn: p.siswa?.nisn,
    answer: '', attachments: [{ name: 'Jawaban', size: 0, path: `/pengumpulan/${p.id_pengumpulan}/file`, remote: true }],
    submittedAt: p.waktu_kumpul, status: graded ? 'graded' : 'submitted', late,
    score: nilai ? Number(nilai.nilai) : null, feedback: nilai?.umpan_balik ?? '', nilaiId: nilai ? num(nilai.id_nilai) : null,
    gradedAt: nilai?.updated_at ?? null,
  }
}

// ---- Nilai ------------------------------------------------------------------------------------
export const mapGrade = (n, rel = {}) => {
  const r = n.rujukan ?? {}
  const idMapel = num(r.id_mapel)
  const tugas = n.sumber === 'tugas'
  const classIds = rel.classIdsOfMapel?.(idMapel) ?? []
  return {
    id: num(n.id_nilai), studentId: num(n.id_siswa), studentName: n.siswa ? nameOf(n.siswa) : rel.studentName?.(n.id_siswa) ?? '-',
    assignmentId: tugas ? num(r.id_tugas) : undefined, quizId: !tugas ? num(r.id_kuis) : undefined, source: n.sumber,
    assignmentTitle: r.judul ?? '-', classId: classIds[0], className: rel.className?.(classIds[0]) ?? '-',
    subjectName: rel.subjectName?.(idMapel) ?? '-', score: Number(n.nilai), feedback: n.umpan_balik ?? '', gradedAt: n.updated_at ?? n.created_at ?? null,
  }
}
export const avg1 = (nums) => (nums.length ? Math.round((nums.reduce((s, x) => s + x, 0) / nums.length) * 10) / 10 : null)

// ---- Jadwal -----------------------------------------------------------------------------------
export const mapSchedule = (j) => {
  const start = new Date(j.waktu_mulai)
  const jsDay = start.getDay()
  return {
    id: num(j.id_jadwal), classId: num(j.id_kelas), subjectId: num(j.id_mapel), teacherId: num(j.id_guru),
    className: j.kelas?.nama_kelas ?? '-', subjectName: j.mapel?.nama_mapel ?? '-', teacherName: j.guru ? nameOf(j.guru) : '-',
    // Frontend memakai dayIndex 1=Senin … 7=Minggu dan time "HH:MM".
    dayIndex: jsDay === 0 ? 7 : jsDay, time: hhmm(j.waktu_mulai), endTime: hhmm(j.waktu_selesai),
    startsAt: j.waktu_mulai, endsAt: j.waktu_selesai, durationMin: j.durasi_menit, state: j.status, room: '-',
  }
}

// ---- Pengumuman -------------------------------------------------------------------------------
export const mapAnnouncement = (a) => ({
  id: num(a.id_pengumuman), title: a.judul, body: a.isi,
  // Backend: cakupan global|mapel. Tidak ada kategori, sasaran peran, maupun draft.
  category: a.cakupan === 'mapel' ? (a.mapel?.nama_mapel ?? 'Mapel') : 'Umum',
  audience: 'all', status: 'published', scope: a.cakupan, subjectId: num(a.id_mapel),
  author: a.penulis?.username ?? '-', createdAt: String(a.created_at ?? '').slice(0, 10), createdAtIso: a.created_at,
})

// ---- Presensi ---------------------------------------------------------------------------------
export const mapRosterRow = (r, i) => {
  const p = r.presensi
  const status = ATT_IN[r.status_kehadiran] ?? 'A'
  const geo = p?.lokasi_lat != null
  return {
    no: i + 1, studentId: num(r.id_siswa), name: r.username || r.nisn || `Siswa ${r.id_siswa}`, nisn: r.nisn ?? '-', status,
    note: '', time: p?.waktu_checkin ? hhmm(p.waktu_checkin) : null, presensiId: p ? num(p.id_presensi) : null, recorded: r.status_kehadiran !== 'belum_tercatat',
    method: p ? (geo ? { kind: 'geo', label: `Geofencing${p.jarak_meter != null ? ` (${Math.round(p.jarak_meter)} m)` : ''}` } : p.waktu_checkin ? { kind: 'manual', label: 'Check-in tanpa lokasi' } : { kind: 'note', label: 'Dicatat guru' }) : { kind: 'note', label: 'Belum tercatat' },
  }
}
export const statsOfRows = (rs) => {
  const c = (k) => rs.filter((r) => r.status === k).length
  const h = c('H')
  return { total: rs.length, h, i: c('I'), s: c('S'), a: c('A'), pct: rs.length ? Math.round((h / rs.length) * 1000) / 10 : 0 }
}

// ---- Kuis -------------------------------------------------------------------------------------
export const mapQuiz = (k, rel = {}) => {
  const idMapel = num(k.id_mapel)
  const classIds = rel.classIdsOfMapel?.(idMapel) ?? []
  const done = k.jumlah_nilai ?? 0
  return {
    id: num(k.id_kuis), title: k.judul, type: 'Google Form', questionCount: 0, status: done > 0 ? 'running' : 'draft', link: k.tautan_google_form,
    subjectId: idMapel, subjectName: k.mapel?.nama_mapel ?? rel.subjectName?.(idMapel) ?? '-', classIds, classNames: classIds.map((c) => rel.className?.(c) ?? '-'),
    rombel: classIds.length ? classIds.map((c) => rel.className?.(c) ?? '-').join(', ') : (k.mapel?.nama_mapel ?? '-'),
    done, total: done, avg: null, syncedAt: null, audience: k.mapel?.nama_mapel,
  }
}

// ---- Helper 5B: tanggal lokal, jadwal admin, rekap presensi ------------------------------------
// 'YYYY-MM-DD' lokal dari Date/ISO (zona peramban).
export const dayKey = (v = new Date()) => { const d = v instanceof Date ? v : new Date(v); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}` }
// Tanggal + jam lokal → ISO-8601 DENGAN offset zona (backend menolak waktu tanpa offset), mis. 2026-11-16T07:30:00+07:00.
export const localIso = (date, time) => {
  const d = new Date(`${date}T${time}:00`)
  if (!date || !time || Number.isNaN(d.getTime())) return ''
  const off = -d.getTimezoneOffset(), a = Math.abs(off)
  return `${date}T${time}:00${off >= 0 ? '+' : '-'}${p2(Math.floor(a / 60))}:${p2(a % 60)}`
}
// Senin dari pekan yang memuat tanggal itu; kembalikan 7 tanggal (Senin…Minggu) sebagai 'YYYY-MM-DD'.
export const weekDays = (v = new Date()) => {
  const d = new Date(v instanceof Date ? v : `${v}T00:00:00`)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return dayKey(x) })
}
// Rekap kehadiran per siswa (GET /rekap/presensi). "Hadir" = hadir + terlambat.
export const mapRekap = (r, i = 0) => {
  const total = Number(r.total_sesi ?? 0), h = Number(r.hadir ?? 0) + Number(r.terlambat ?? 0)
  return {
    id: num(r.id_siswa), no: i + 1, studentId: num(r.id_siswa), name: r.username || r.nisn || `Siswa ${r.id_siswa}`, nisn: r.nisn ?? '-',
    total, recorded: Number(r.tercatat ?? 0), pending: Number(r.belum_tercatat ?? 0), h, late: Number(r.terlambat ?? 0),
    i: Number(r.izin ?? 0), s: Number(r.sakit ?? 0), a: Number(r.alpa ?? 0), pct: total ? Math.round((h / total) * 1000) / 10 : 0,
  }
}
// Sesi yang jam-nya saling tumpang tindih untuk kelas yang sama ATAU guru yang sama (hanya untuk penanda tampilan;
// penolakan sesungguhnya dilakukan backend). Mengembalikan Set id sesi yang bentrok.
export const conflictIds = (sessions) => {
  const out = new Set()
  const t = (x) => new Date(x.startsAt).getTime()
  const e = (x) => new Date(x.endsAt).getTime()
  for (let i = 0; i < sessions.length; i++) for (let j = i + 1; j < sessions.length; j++) {
    const a = sessions[i], b = sessions[j]
    if (!(t(a) < e(b) && t(b) < e(a))) continue
    if ((a.classId && a.classId === b.classId) || (a.teacherId && a.teacherId === b.teacherId)) { out.add(a.key ?? a.id); out.add(b.key ?? b.id) }
  }
  return out
}

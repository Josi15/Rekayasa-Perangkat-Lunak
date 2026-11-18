import { teacherHome } from '../data/teacherHome'

// Store presensi bersama (dashboard & halaman presensi). Seed: 32 siswa X IPA 1 = 30 hadir, 1 izin, 1 sakit.
const head = [
  ['Raditya Pratama', '0064829104'], ['Nabila Dwi Ananda', '0065192841'], ['Ahmad Rayhan Pratama', '0063920194'], ['Clarissa Aurelia Putri', '0067784310'],
  ['Daffa Ibnu Khaldun', '0059918234'], ['Fatimah Zahra Wardani', '0061245908'], ['Gilang Ramadhan Kusuma', '0058823190'],
]
const tail = ['Hana Safitri', 'Irfan Maulana', 'Jasmine Kirana', 'Kevin Aditya', 'Laila Rahmawati', 'Muhammad Fajar', 'Nadia Putri Utami', 'Omar Faruq', 'Putri Ayu Lestari', 'Qory Ramadhani', 'Rizky Firmansyah', 'Salsabila Nur Aini', 'Taufik Hidayat', 'Ulfa Maharani', 'Vino Saputra', 'Wulan Sari', 'Xavier Pradipta', 'Yusuf Alfarizi', 'Zahra Amelia', 'Andi Pratama', 'Siti Nurhaliza', 'Bagas Wicaksono', 'Citra Dewanti', 'Dimas Prakoso', 'Eka Nugraha']
const real = { 'Andi Pratama': [3, '0064891224'], 'Siti Nurhaliza': [4, '0068129031'] }
const roster = [...head, ...tail.map((n, i) => (real[n] ? [n, real[n][1], real[n][0]] : [n, `00${String(58000000 + ((i + 8) * 7919) % 8000000).padStart(8, '0')}`]))]

const records = roster.map(([name, nisn, id], i) => ({
  no: i + 1, studentId: id ?? 100 + i, name, nisn, status: 'H', note: '',
  time: `08:${String(30 + (i % 9)).padStart(2, '0')}`,
  method: i % 3 === 1 ? { kind: 'geo', label: `Geofencing (Akurasi ${5 + (i % 6)}m)` } : { kind: 'wifi', label: 'WiFi Lab Terverifikasi' },
}))
Object.assign(records[0], { time: '08:32', note: 'Tepat waktu, siap di Meja 1' })
Object.assign(records[1], { time: '08:34', method: { kind: 'geo', label: 'Geofencing (Akurasi 8m)' }, note: 'Membawa perlengkapan lengkap' })
Object.assign(records[2], { time: '08:35' })
Object.assign(records[3], { time: '08:31', note: 'Ketua Tim Kelompok 2' })
Object.assign(records[4], { status: 'S', time: null, method: { kind: 'doc', label: 'Surat Sakit Terlampir (PDF)' }, note: 'Demam tinggi, istirahat dokter 2 hari' })
Object.assign(records[5], { status: 'I', time: null, method: { kind: 'award', label: 'Dispensasi Lomba OSN' }, note: 'Pelatihan Terpusat Olimpiade Matematika' })
Object.assign(records[6], { time: '08:38', method: { kind: 'manual', label: 'Manual Guru (Baterai Habis)' }, note: 'Dikonfirmasi hadir fisik langsung di lab' })

const s = teacherHome.session
export const attendance = {
  open: true,
  records,
  session: { className: teacherHome.homeroom.name, title: `${s.title} — Sesi ${s.period}`, mode: 'Tatap Muka', room: s.room, ssid: 'SMAN1_R101', token: 'MTK10-0830', slot: 'Jam 3-4' },
  history: [
    { id: 1, date: '14 Okt 2026', label: 'Jam 3-4 · X IPA 1', h: 31, i: 0, s: 1, a: 0 },
    { id: 2, date: '13 Okt 2026', label: 'Jam 1-2 · X IPA 1', h: 30, i: 1, s: 1, a: 0 },
    { id: 3, date: '12 Okt 2026', label: 'Jam 3-4 · X IPA 1', h: 32, i: 0, s: 0, a: 0 },
  ],
}

export const statsOf = (rs) => {
  const c = (k) => rs.filter((r) => r.status === k).length
  const h = c('H')
  return { total: rs.length, h, i: c('I'), s: c('S'), a: c('A'), pct: rs.length ? Math.round((h / rs.length) * 1000) / 10 : 0 }
}

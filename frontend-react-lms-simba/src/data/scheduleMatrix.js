// Data simulasi matriks jadwal mingguan guru (Senin–Jumat).
const t = (className, topic, room) => ({ kind: 'teach', className, topic, room })
const l = (className, tag, topic, room) => ({ kind: 'lab', className, tag, topic, room })
const n = (title, topic) => ({ kind: 'note', title, topic })
const d = (title, topic, room) => ({ kind: 'duty', title, topic, room })

export const scheduleMatrix = {
  academicYear: '2026/2027', semester: 'Ganjil', standardJp: 24,
  days: [{ index: 1, label: 'Senin' }, { index: 2, label: 'Selasa' }, { index: 3, label: 'Rabu' }, { index: 4, label: 'Kamis' }, { index: 5, label: 'Jumat' }],
  studentCount: { 'X IPA 1': 32, 'X IPS 2': 30, 'XI IPA 1': 34, 'XI IPA 2': 33 },
  rows: [
    { type: 'slot', id: 's1', label: 'Jam 1 - 2', start: '07:15', end: '08:45', jp: 2 },
    { type: 'slot', id: 's2', label: 'Jam 3 - 4', start: '08:45', end: '10:15', jp: 2 },
    { type: 'break', id: 'b1', start: '10:15', end: '10:45', label: 'ISTIRAHAT PERTAMA & SHALAT DHUHA (30 MENIT)' },
    { type: 'slot', id: 's3', label: 'Jam 5 - 6', start: '10:45', end: '12:15', jp: 2 },
    { type: 'slot', id: 's4', label: 'Jam 7 - 8', start: '13:00', end: '14:30', jp: 2 },
  ],
  cells: {
    's1-1': d('Upacara & Wali Kelas', 'Agenda Rutin', 'Lapangan'), 's1-2': t('X IPA 1', 'Fungsi Kuadrat & Grafik Parabola', 'R. 101'),
    's1-3': t('XI IPA 1', 'Trigonometri: Perbandingan Sudut', 'R. 201'), 's1-4': n('Penyusunan Modul', 'Ruang Guru'), 's1-5': t('X IPS 2', 'Persamaan Linear Satu Variabel', 'R. 102'),
    's2-1': t('XI IPA 2', 'Barisan & Deret Aritmetika', 'R. 202'), 's2-2': l('X IPS 2', 'Praktikum', 'Statistika: Pengolahan Data', 'Lab Komputer 1'),
    's2-3': t('XI IPA 1', 'Identitas Trigonometri', 'R. 201'), 's2-4': l('XI IPA 2', 'GeoGebra', 'Grafik Fungsi dengan GeoGebra', 'Lab Komputer 1'), 's2-5': t('X IPA 1', 'Pertidaksamaan Kuadrat', 'R. 101'),
    's3-1': n('Jam Kerja Mandiri', 'Perangkat Ajar'), 's3-2': t('X IPS 2', 'Sistem Persamaan Linear', 'R. 102'),
    's3-3': d('Konsultasi Siswa', 'Wali Kelas X IPA 1', 'Ruang Konseling'), 's3-4': t('X IPA 1', 'Fungsi Eksponen', 'R. 101'), 's3-5': t('XI IPA 2', 'Limit Fungsi', 'R. 202'),
    's4-1': l('X IPA 1', 'Praktikum', 'Pemodelan Fungsi dengan Spreadsheet', 'Lab Komputer 2'), 's4-2': n('Evaluasi Formatif CBT', 'Online Asynchronous'),
    's4-3': d('Jadwal Piket Guru', 'Monitoring Presensi & Ketertiban', 'Lobi Gedung B'), 's4-4': t('XI IPA 2', 'Kuis Bab 3 via SIMBA CBT', 'R. 202'), 's4-5': t('XI IPA 1', 'Turunan Fungsi', 'R. 201'),
  },
  labs: [
    { id: 1, name: 'Laboratorium Komputer 1', status: 'available', note: 'Kapasitas: 36 Siswa (PC siap)' },
    { id: 2, name: 'Laboratorium Komputer 2', status: 'busy', usedBy: 'X IPS 2', note: 'Sampai pukul 10:15 WIB (Praktikum Statistika)' },
  ],
}

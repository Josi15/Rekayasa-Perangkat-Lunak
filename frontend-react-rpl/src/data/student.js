// Data simulasi modul siswa (satu siswa: id 1). Tanggal dihitung relatif terhadap hari ini.
import { daysFromNow } from '../utils/date.js'

export const courses = [
  { id: 1, name: 'Matematika Wajib', category: 'Sains', teacher: 'Budi Santoso', description: 'Aljabar, fungsi, dan pertidaksamaan untuk dasar penalaran kuantitatif.' },
  { id: 2, name: 'Bahasa Indonesia', category: 'Bahasa', teacher: 'Rina Wulandari', description: 'Menulis dan menelaah teks eksposisi, struktur kalimat, serta esai.' },
  { id: 3, name: 'Fisika', category: 'Sains', teacher: 'Agus Salim', description: 'Mekanika klasik: gerak, gaya, usaha, dan energi dalam kehidupan sehari-hari.' },
  { id: 4, name: 'Sejarah Indonesia', category: 'Sosial', teacher: 'Dewi Lestari', description: 'Perjalanan bangsa dari kerajaan Hindu-Buddha hingga masa kolonial.' },
  { id: 5, name: 'Bahasa Inggris', category: 'Bahasa', teacher: 'Maya Putri', description: 'Tata bahasa dan pemahaman bacaan untuk komunikasi sehari-hari.' },
]

const m = (id, courseId, order, title, minutes, intro, points, attachments = []) => ({
  id, courseId, order, title, minutes, summary: intro, attachments,
  blocks: [
    { t: 'p', v: intro },
    { t: 'img', cap: `Ilustrasi konsep: ${title}`, tone: id % 4 },
    { t: 'h', v: 'Poin utama' },
    { t: 'list', v: points },
    { t: 'p', v: 'Setelah selesai membaca, tandai materi ini sebagai sudah dipelajari agar progres kelas Anda diperbarui.' },
  ],
})
const pdf = (name, size) => [{ name, type: 'PDF', size }]

export const materials = [
  m(1, 1, 1, 'Persamaan Kuadrat', 12, 'Persamaan kuadrat berbentuk ax² + bx + c = 0 dengan a ≠ 0. Akar-akarnya dapat dicari dengan pemfaktoran, melengkapkan kuadrat, atau rumus abc.', ['Identifikasi koefisien a, b, dan c', 'Hitung diskriminan D = b² − 4ac', 'D > 0 dua akar real berbeda, D = 0 akar kembar, D < 0 tidak real'], pdf('Ringkasan-Persamaan-Kuadrat.pdf', '1,2 MB')),
  m(2, 1, 2, 'Fungsi Kuadrat', 15, 'Grafik fungsi kuadrat berupa parabola. Arah bukaan ditentukan oleh tanda koefisien a, sedangkan titik puncak menentukan nilai maksimum atau minimum.', ['Sumbu simetri x = −b/2a', 'Titik puncak (xp, yp)', 'Titik potong dengan sumbu x dan sumbu y'], pdf('Latihan-Fungsi-Kuadrat.pdf', '860 KB')),
  m(3, 1, 3, 'Pertidaksamaan Kuadrat', 10, 'Penyelesaian pertidaksamaan kuadrat dilakukan dengan mencari akar, menggambar garis bilangan, lalu menguji tanda tiap interval.', ['Ubah ke bentuk standar', 'Tentukan akar sebagai batas interval', 'Uji tanda dan tulis himpunan penyelesaian']),
  m(4, 2, 1, 'Teks Eksposisi', 10, 'Teks eksposisi menjelaskan suatu gagasan secara logis disertai fakta dan argumen pendukung tanpa memaksa pembaca.', ['Struktur: tesis, argumentasi, penegasan ulang', 'Gunakan kata penghubung kausalitas', 'Dukung dengan data atau contoh'], pdf('Contoh-Teks-Eksposisi.pdf', '540 KB')),
  m(5, 2, 2, 'Struktur Kalimat', 8, 'Kalimat efektif memiliki subjek dan predikat yang jelas serta tidak bertele-tele.', ['Kenali subjek, predikat, objek, keterangan', 'Hindari pemborosan kata', 'Jaga paralelisme antarunsur']),
  m(6, 2, 3, 'Menulis Esai', 14, 'Esai yang baik dibangun dari kerangka: pembuka yang menarik, isi yang runtut, dan penutup yang menyimpulkan.', ['Tentukan tema dan tujuan', 'Susun kerangka paragraf', 'Revisi ejaan dan kelogisan']),
  m(7, 3, 1, 'Gerak Lurus', 12, 'Gerak lurus beraturan memiliki kecepatan tetap, sedangkan gerak lurus berubah beraturan memiliki percepatan tetap.', ['GLB: s = v × t', 'GLBB: v = v0 + at', 'Grafik v–t dan s–t menggambarkan jenis gerak'], pdf('Rumus-Gerak-Lurus.pdf', '420 KB')),
  m(8, 3, 2, 'Hukum Newton', 16, 'Tiga hukum Newton menjelaskan hubungan antara gaya dan gerak benda.', ['Hukum I: kelembaman', 'Hukum II: F = m × a', 'Hukum III: aksi–reaksi'], pdf('Soal-Hukum-Newton.pdf', '1,0 MB')),
  m(9, 3, 3, 'Usaha dan Energi', 13, 'Usaha adalah gaya yang menyebabkan perpindahan. Energi mekanik adalah jumlah energi kinetik dan potensial.', ['W = F × s × cos θ', 'Ek = ½mv² dan Ep = mgh', 'Hukum kekekalan energi mekanik']),
  m(10, 4, 1, 'Kerajaan Hindu-Buddha', 11, 'Pengaruh Hindu-Buddha membentuk kerajaan besar di Nusantara seperti Kutai, Sriwijaya, dan Majapahit.', ['Jalur perdagangan dan penyebaran budaya', 'Sistem pemerintahan dan kepercayaan', 'Peninggalan: candi, prasasti, naskah'], pdf('Peta-Kerajaan.pdf', '2,3 MB')),
  m(11, 4, 2, 'Masa Kolonial', 14, 'Kedatangan bangsa Eropa mengubah struktur ekonomi dan politik Nusantara, memicu berbagai bentuk perlawanan.', ['Monopoli perdagangan VOC', 'Sistem tanam paksa', 'Perlawanan daerah']),
  m(12, 5, 1, 'Simple Past Tense', 9, 'Simple past tense dipakai untuk peristiwa yang selesai pada waktu lampau yang jelas.', ['Pola: Subject + V2', 'Kalimat negatif memakai did not + V1', 'Penanda waktu: yesterday, last week, in 2020'], pdf('Irregular-Verbs.pdf', '300 KB')),
  m(13, 5, 2, 'Reading Comprehension', 12, 'Pemahaman bacaan melatih kemampuan menemukan gagasan utama dan informasi rinci dari teks.', ['Skim untuk gagasan utama', 'Scan untuk informasi spesifik', 'Tebak makna kata dari konteks']),
]

export const initialProgress = { 1: daysFromNow(-4, 10), 2: daysFromNow(-2, 9), 4: daysFromNow(-3, 14), 7: daysFromNow(-5, 8), 10: daysFromNow(-6, 11), 12: daysFromNow(-1, 15) }

export const seedActivities = [
  { id: 'a1', text: 'Mengumpulkan tugas "Latihan Fungsi Kuadrat"', at: daysFromNow(-1, 16) },
  { id: 'a2', text: 'Menerima nilai "Kuis Masa Kolonial" (85)', at: daysFromNow(-2, 13) },
]

const a = (id, courseId, title, dueDays, state, extra = {}) => ({
  id, courseId, title, due: daysFromNow(dueDays), state, maxScore: 100,
  description: `Kerjakan tugas "${title}" sesuai instruksi di bawah ini.`,
  instructions: ['Baca materi terkait sebelum mengerjakan.', 'Tulis jawaban dengan bahasa sendiri dan runtut.', 'Lampirkan berkas pendukung bila diperlukan.', 'Kumpulkan sebelum tenggat; pengumpulan setelah tenggat ditandai terlambat.'],
  ...extra,
})
const fb = { 78: 'Konsep dasar sudah tepat, perhatikan ketelitian langkah hitung.', 80: 'Analisis cukup baik, tambahkan satuan pada setiap hasil.', 84: 'Grafik rapi dan jelas. Pertahankan.', 85: 'Jawaban lengkap dan sistematis.', 88: 'Argumen kuat dan bahasa mengalir.', 90: 'Sangat baik, hanya sedikit salah penulisan bentuk kata kerja.', 92: 'Pemahaman bacaan sangat baik.' }
const graded = (score, subDays, gradeDays) => ({ score, feedback: fb[score], submittedAt: daysFromNow(subDays, 10), gradedAt: daysFromNow(gradeDays, 14) })

export const studentAssignments = [
  a(1, 1, 'Latihan Persamaan Kuadrat', 1, 'todo'),
  a(2, 2, 'Esai Teks Eksposisi', 3, 'todo'),
  a(3, 3, 'Laporan Praktikum Gerak', 6, 'todo'),
  a(4, 4, 'Kuis Masa Kolonial', -3, 'graded', graded(85, -4, -2)),
  a(5, 5, 'Tugas Simple Past', -6, 'graded', graded(90, -7, -5)),
  a(6, 1, 'Latihan Fungsi Kuadrat', -1, 'submitted', { submittedAt: daysFromNow(-2, 16), answer: 'Grafik fungsi memiliki titik puncak di (2, -1) dan terbuka ke atas.', attachments: [{ name: 'jawaban-fungsi-kuadrat.pdf', size: 420000, type: 'pdf' }] }),
  a(7, 4, 'Rangkuman Sumber Sejarah', -3, 'todo'),
  a(8, 1, 'Kuis Aljabar', -10, 'graded', graded(78, -11, -9)),
  a(9, 1, 'Tugas Grafik Parabola', -6, 'graded', graded(84, -7, -5)),
  a(10, 2, 'Resensi Buku', -8, 'graded', graded(88, -9, -7)),
  a(11, 3, 'Soal Hukum Newton', -5, 'graded', graded(80, -6, -4)),
  a(12, 5, 'Reading Quiz', -11, 'graded', graded(92, -12, -10)),
]

export const studentSchedules = [
  { id: 1, day: 1, start: '07:00', end: '08:30', courseId: 1, room: 'R. 101' },
  { id: 2, day: 2, start: '09:00', end: '10:30', courseId: 3, room: 'Lab Fisika' },
  { id: 3, day: 3, start: '07:00', end: '08:30', courseId: 2, room: 'R. 102' },
  { id: 4, day: 4, start: '10:30', end: '12:00', courseId: 4, room: 'R. 105' },
  { id: 5, day: 5, start: '08:00', end: '09:30', courseId: 5, room: 'R. 103' },
  { id: 6, day: 1, start: '13:00', end: '14:30', courseId: 3, room: 'R. 101' },
  { id: 7, day: 2, start: '07:00', end: '08:30', courseId: 5, room: 'R. 103' },
  { id: 8, day: 3, start: '09:00', end: '10:30', courseId: 1, room: 'R. 101' },
  { id: 9, day: 5, start: '10:00', end: '11:30', courseId: 2, room: 'R. 102' },
  { id: 10, day: 4, start: '08:00', end: '09:30', courseId: 3, room: 'Lab Fisika' },
]

export const studentAnnouncements = [
  { id: 1, title: 'Ujian Tengah Semester dimulai pekan depan', category: 'Akademik', author: 'Tata Usaha', body: 'Ujian Tengah Semester akan dilaksanakan mulai pekan depan. Jadwal lengkap dan ruang ujian dibagikan melalui wali kelas.\n\nPastikan membawa kartu pelajar dan alat tulis sendiri.', at: daysFromNow(-1, 8) },
  { id: 2, title: 'Perpustakaan buka sampai pukul 17.00', category: 'Fasilitas', author: 'Perpustakaan', body: 'Selama masa persiapan ujian, perpustakaan buka hingga pukul 17.00. Ruang belajar bersama dapat dipakai tanpa reservasi.', at: daysFromNow(-3, 9) },
  { id: 3, title: 'Lomba Karya Tulis Ilmiah', category: 'Kegiatan', author: 'Kesiswaan', body: 'Pendaftaran lomba Karya Tulis Ilmiah dibuka hingga akhir bulan. Peserta dapat mendaftar secara individu atau kelompok maksimal tiga orang.', at: daysFromNow(-5, 10) },
  { id: 4, title: 'Pembaruan tata tertib sekolah', category: 'Umum', author: 'Kepala Sekolah', body: 'Tata tertib sekolah telah diperbarui. Seluruh siswa diminta membaca versi terbaru yang dibagikan oleh wali kelas.', at: daysFromNow(-8, 7) },
  { id: 5, title: 'Pengambilan buku paket semester genap', category: 'Akademik', author: 'Tata Usaha', body: 'Buku paket dapat diambil di ruang tata usaha setiap hari kerja pukul 09.00 - 14.00.', at: daysFromNow(-12, 11) },
]

export const profileSeed = { 1: { nis: '2024.10.0123', className: 'X IPA 1', phone: '0812-3456-7890', address: 'Semarang, Jawa Tengah' } }
export const initialReadAnnouncements = [3, 5]

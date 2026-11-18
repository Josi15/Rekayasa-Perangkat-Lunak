// Data dummy halaman Jadwal & Kalender KBM. Ganti dengan data backend.
const ringkasan = {
  sesi: { total: 192, rombel: 24, persen: 100 },
  guru: { total: 54, rata: 26 },
  lab: { aktif: 8, util: [{ k: 'Bio', v: 85 }, { k: 'Fisika', v: 78 }, { k: 'Komp', v: 92 }], persen: 82 },
  konflik: { total: 0 }
};

const rombel = [
  { id: 'xii-mipa-1', label: 'XII MIPA 1 (36 Siswa)', nama: 'XII MIPA 1' },
  { id: 'xii-mipa-2', label: 'XII MIPA 2 (35 Siswa)', nama: 'XII MIPA 2' },
  { id: 'xi-mipa-1', label: 'XI MIPA 1 (36 Siswa)', nama: 'XI MIPA 1' },
  { id: 'x-1', label: 'X-1 (34 Siswa)', nama: 'X-1' }
];

const hari = [
  { key: 'senin', label: 'Senin' }, { key: 'selasa', label: 'Selasa' }, { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' }, { key: 'jumat', label: 'Jumat' }
];

// tipe: sesi | istirahat ; status: selesai | berlangsung | berikutnya | terjadwal ; jenis: teori | praktikum
const senin = [
  { tipe: 'sesi', jam: 'JAM 1 - 2', waktu: '07:15 - 08:45', mapel: 'Matematika Tingkat Lanjut', jp: '2 JP Teori', jenis: 'teori',
    guru: 'Dra. Sri Wahyuni, M.Pd. (NIP: 19780211...)', ruang: 'Ruang Kelas XII MIPA 1 (Gd. B Lt. 2)', status: 'selesai' },
  { tipe: 'sesi', jam: 'JAM 3 - 4', waktu: '08:45 - 10:15', mapel: 'Biologi: Genetika Molekuler', jp: '', jenis: 'praktikum',
    guru: 'Ahmad Fauzi, S.Si., M.Sc.', ruang: 'Lab Biologi 2 (Gedung Sains)', status: 'berlangsung' },
  { tipe: 'istirahat', ikon: 'bi-cup-hot', label: 'Istirahat Pagi & Literasi Al-Qur\'an / Pojok Baca', waktu: '10:15 - 10:30 (15 Menit)' },
  { tipe: 'sesi', jam: 'JAM 5 - 6', waktu: '10:30 - 11:45', mapel: 'Bahasa Indonesia: Teks Editorial', jp: '2 JP Teori', jenis: 'teori',
    guru: 'Siti Nurhaliza, S.Pd.', ruang: 'Ruang Kelas XII MIPA 1', status: 'berikutnya' },
  { tipe: 'istirahat', ikon: 'bi-moon-stars', label: 'Istirahat Siang, Sholat Berjamaah & Makan (ISHOMA)', waktu: '11:45 - 12:45 (60 Menit)' },
  { tipe: 'sesi', jam: 'JAM 7 - 8', waktu: '12:45 - 14:15', mapel: 'Fisika: Gelombang Elektromagnetik', jp: '2 JP Teori & Diskusi', jenis: 'teori',
    guru: 'Bambang Hermanto, M.Si.', ruang: 'Ruang Kelas XII MIPA 1', status: 'terjadwal' }
];
const selasa = [
  { tipe: 'sesi', jam: 'JAM 1 - 2', waktu: '07:15 - 08:45', mapel: 'Kimia: Termokimia', jp: '2 JP Praktikum', jenis: 'praktikum',
    guru: 'Rina Marlina, S.Si.', ruang: 'Lab Kimia 1 (Gedung Sains)', status: 'terjadwal' },
  { tipe: 'sesi', jam: 'JAM 3 - 4', waktu: '08:45 - 10:15', mapel: 'Bahasa Inggris', jp: '2 JP Teori', jenis: 'teori',
    guru: 'Nurul Diana, S.Pd.', ruang: 'Ruang Kelas XII MIPA 1', status: 'terjadwal' },
  { tipe: 'istirahat', ikon: 'bi-cup-hot', label: 'Istirahat Pagi', waktu: '10:15 - 10:30 (15 Menit)' },
  { tipe: 'sesi', jam: 'JAM 5 - 6', waktu: '10:30 - 11:45', mapel: 'Matematika Peminatan', jp: '2 JP Teori', jenis: 'teori',
    guru: 'Hendro Kusuma, M.Si.', ruang: 'Ruang Kelas XII MIPA 1', status: 'terjadwal' }
];
const rabu = [
  { tipe: 'sesi', jam: 'JAM 1 - 2', waktu: '07:15 - 08:45', mapel: 'Pendidikan Agama & Budi Pekerti', jp: '2 JP Teori', jenis: 'teori',
    guru: 'Drs. Ahmad Zubaidi', ruang: 'Ruang Kelas XII MIPA 1', status: 'terjadwal' },
  { tipe: 'sesi', jam: 'JAM 3 - 4', waktu: '08:45 - 10:15', mapel: 'Informatika: Rekayasa Perangkat Lunak', jp: '2 JP Praktikum', jenis: 'praktikum',
    guru: 'Ahmad Fauzi, S.Kom.', ruang: 'Lab Komputer 3 (Gedung Sains)', status: 'terjadwal' }
];
const kamis = [
  { tipe: 'sesi', jam: 'JAM 1 - 2', waktu: '07:15 - 08:45', mapel: 'Fisika: Fisika Modern', jp: '2 JP Teori', jenis: 'teori',
    guru: 'Bambang Hermanto, M.Si.', ruang: 'Ruang Kelas XII MIPA 1', status: 'terjadwal' },
  { tipe: 'sesi', jam: 'JAM 3 - 4', waktu: '08:45 - 10:15', mapel: 'Bahasa & Budaya Daerah Sunda', jp: '2 JP Teori', jenis: 'teori',
    guru: 'Dra. Nining Suryati', ruang: 'Ruang Kelas XII MIPA 1', status: 'terjadwal' }
];
const jumat = [
  { tipe: 'sesi', jam: 'JAM 1 - 2', waktu: '07:15 - 08:45', mapel: 'Pengembangan Diri: Kokurikuler P5', jp: '2 JP Projek', jenis: 'teori',
    guru: 'Tim Kokurikuler', ruang: 'Aula Serbaguna', status: 'terjadwal' },
  { tipe: 'istirahat', ikon: 'bi-moon-stars', label: 'Sholat Jumat & ISHOMA', waktu: '11:15 - 13:00 (105 Menit)' }
];
const jadwal = { senin, selasa, rabu, kamis, jumat };

const lab = [
  { nama: 'Lab Biologi 2', status: 'Terpakai', kelas: 'busy', info: 'Digunakan oleh: XII MIPA 1 (Ahmad Fauzi, M.Sc.)', foot: 'Hingga pukul 10:15 WIB', ikon: 'bi-clock' },
  { nama: 'Lab Kimia 1', status: 'Tersedia', kelas: 'free', info: 'Kapasitas: 40 Meja Praktik • Alat & Reagen Steril', foot: 'Slot siap dibooking sesi siang', ikon: 'bi-check-circle' },
  { nama: 'Lab Komputer 3', status: 'Sterilisasi CBT', kelas: 'cbt', info: 'Persiapan Simulasi Asesmen Nasional & PTS', foot: 'Akses khusus teknisi jaringan', ikon: 'bi-lock' }
];

const aksiCepat = [
  { judul: 'Tukar Jam Mengajar', ket: 'Tukar jadwal antarguru tanpa bentrok', ikon: 'bi-arrow-left-right', toast: 'Fitur tukar jam mengajar (simulasi).' },
  { judul: 'Atur Guru Pengganti (Inval)', ket: 'Penugasan guru izin/dinas luar', ikon: 'bi-person-gear', toast: 'Fitur guru pengganti (simulasi).' },
  { judul: 'Publikasi ke Kalender Siswa', ket: 'Sinkronisasi instan ke portal siswa', ikon: 'bi-upload', toast: 'Jadwal dipublikasikan ke portal siswa (simulasi).', primary: true }
];

const agenda = [
  { bln: 'KAM', tgl: 19, tone: 'pink', judul: 'Penilaian Tengah Semester (PTS) Gasal', sub: 'Khusus Tingkat X & XI • Berbasis CBT', ket: 'Sesi KBM kelas XII tetap berjalan reguler' },
  { bln: 'SAB', tgl: 21, tone: 'green', judul: 'Rapat Koordinasi Kurikulum', sub: 'Auditorium Sasana Graha • 09:00 WIB', ket: 'Evaluasi ketercapaian Modul Ajar pekan ke-8' }
];

const distribusi = [
  { judul: 'MIPA Peminatan', jp: 16, ket: 'Bio, Fis, Kim, Mat-L' },
  { judul: 'Umum & Wajib', jp: 18, ket: 'B.Indo, B.Ing, PAI, PPKn' },
  { judul: 'Praktikum Laboratorium', jp: 6, ket: 'Lab Bio & Fisika Terisi', praktikum: true },
  { judul: 'Pengembangan Diri', jp: 4, ket: 'BK, Kokurikuler P5' }
];

module.exports = { ringkasan, rombel, hari, jadwal, lab, aksiCepat, agenda, distribusi, hariAktif: 'senin' };

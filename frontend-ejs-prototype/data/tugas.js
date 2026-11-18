// Data dummy halaman Bank Tugas & Monitoring Evaluasi. Ganti dengan data backend.
module.exports = {
  ringkasan: {
    aktif: { total: 76, ket: '24 Rombel (Tingkat X, XI, XII)' },
    tepatWaktu: { persen: 94.5, naik: '+2.1%', ket: 'Kedisiplinan Siswa Tinggi' },
    koreksi: { total: 18, ket: 'SLA Maks. 24 Jam Koreksi' },
    rataNilai: { nilai: 87.8, kkm: 75.0 }
  },
  opsi: {
    rombel: ['XII MIPA 1', 'XII MIPA 2', 'XI MIPA 3', 'X-1', 'X-4'],
    mapel: ['Biologi', 'Fisika', 'Kimia', 'Matematika'],
    status: [{ v: 'menunggu', l: 'Menunggu Koreksi' }, { v: 'berjalan', l: 'Sedang Berjalan' }, { v: 'selesai', l: 'Selesai Dinilai' }]
  },
  // status: menunggu | berjalan | selesai
  tugas: [
    { kode: 'TUGAS-BIO-XII-04', nama: 'Laporan Praktikum Uji Enzim Katalase', rombel: 'XII MIPA 1', rombelTampil: 'XII MIPA 1', mapel: 'Biologi', guru: 'Ibu Siti Rahmawati, S.Pd.', batas: 'Hari ini, 23:59 WIB', hariIni: true, kumpul: 34, total: 36, status: 'menunggu', menunggu: 18 },
    { kode: 'TUGAS-FIS-XII-02', nama: 'Makalah Induksi Elektromagnetik', rombel: 'XII MIPA 2', rombelTampil: 'XII MIPA 1 & 2', mapel: 'Fisika', guru: 'Drs. Bambang Sudarsono, M.T.', batas: '25 Mei 2025', kumpul: 70, total: 72, status: 'selesai' },
    { kode: 'TUGAS-KIM-XI-03', nama: 'Kinetika Reaksi Orde 2', rombel: 'XI MIPA 3', rombelTampil: 'XI MIPA 3', mapel: 'Kimia', guru: 'Dra. Hj. Nurul Hidayati', batas: '28 Mei 2025', kumpul: 18, total: 36, status: 'berjalan' },
    { kode: 'TUGAS-MAT-X-01', nama: 'Proyek Statistika Terapan Lingkungan', rombel: 'X-4', rombelTampil: 'X-1 s/d X-4', mapel: 'Matematika', guru: 'Dra. Ratna Purwanti', batas: '30 Mei 2025', kumpul: 138, total: 144, status: 'selesai' },
    { kode: 'TUGAS-BIO-XII-05', nama: 'Esai Rekayasa Genetika', rombel: 'XII MIPA 2', rombelTampil: 'XII MIPA 2', mapel: 'Biologi', guru: 'Ibu Siti Rahmawati, S.Pd.', batas: '02 Jun 2025', kumpul: 12, total: 36, status: 'berjalan' },
    { kode: 'TUGAS-FIS-XI-06', nama: 'Laporan Eksperimen Gerak Harmonik', rombel: 'XI MIPA 3', rombelTampil: 'XI MIPA 3', mapel: 'Fisika', guru: 'Drs. Bambang Sudarsono, M.T.', batas: '03 Jun 2025', kumpul: 30, total: 36, status: 'menunggu', menunggu: 30 },
    { kode: 'TUGAS-KIM-XII-07', nama: 'Studi Kasus Elektrolisis Industri', rombel: 'XII MIPA 1', rombelTampil: 'XII MIPA 1', mapel: 'Kimia', guru: 'Dra. Hj. Nurul Hidayati', batas: '05 Jun 2025', kumpul: 35, total: 36, status: 'selesai' },
    { kode: 'TUGAS-MAT-X-02', nama: 'Latihan Fungsi Eksponen & Logaritma', rombel: 'X-1', rombelTampil: 'X-1', mapel: 'Matematika', guru: 'Dra. Ratna Purwanti', batas: '06 Jun 2025', kumpul: 20, total: 36, status: 'berjalan' }
  ],
  statusLabel: { menunggu: 'Menunggu Koreksi', berjalan: 'Sedang Berjalan', selesai: 'Selesai Dinilai' },
  jenis: [
    { nama: 'Portofolio Praktik', persen: 50, warna: '#146c2e' },
    { nama: 'Laporan Eksperimen', persen: 30, warna: '#456a3f' },
    { nama: 'Makalah & Studi Kasus', persen: 20, warna: '#7ad66b' }
  ],
  kepatuhan: { persen: 92, aiGrader: 'Bantuan pra-koreksi objektif aktif' },
  audit: { konektor: 'Turnitin-API Connected', toleransi: 15 },
  total: 76,
  halamanUkuran: 4
};

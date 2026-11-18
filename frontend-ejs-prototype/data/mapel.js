// Data dummy halaman Mata Pelajaran & Kurikulum. Ganti dengan data backend.
const ringkasan = {
  total: { nilai: 32, wajib: 18, peminatan: 10, mulok: 4 },
  jp: { total: 384, rata: 32 },
  koordinator: { total: 54, siapKbm: 100 },
  kktp: { rerata: 75.0, target: 'Target Ketercapaian Nasional' }
};

// kelompok: wajib | peminatan | mulok ; fase: E (Kelas X) | F-MIPA | F-IPS | F-Umum
const tab = [
  { key: 'semua', label: 'Semua (32)' },
  { key: 'E', label: 'Fase E - Kelas X (16)' },
  { key: 'F-MIPA', label: 'Fase F - MIPA (6)' },
  { key: 'F-IPS', label: 'Fase F - IPS (6)' },
  { key: 'mulok', label: 'Muatan Lokal (4)' }
];

const daftar = [
  { kode: 'BIO-301', nama: 'Biologi Tingkat Lanjut', jenjang: 'Kelas XI & XII, Lab Sains Terpadu', ikon: 'bi-flask', kelompok: 'Peminatan Sains (Fase F)', kat: 'peminatan', fase: 'F-MIPA', jp: 5, kktp: 78.0,
    koordinator: { nama: 'Ibu Siti Rahmawati, S.Pd.', inisial: 'SR', tim: '+2 Guru Pengampu' }, modul: 'valid' },
  { kode: 'MAT-302', nama: 'Matematika Peminatan & Kalkulus', jenjang: 'Kelas XII MIPA', ikon: 'bi-calculator', kelompok: 'Peminatan Sains (Fase F)', kat: 'peminatan', fase: 'F-MIPA', jp: 5, kktp: 80.0,
    koordinator: { nama: 'Hendro Kusuma, M.Si.', inisial: 'HK', tim: '+3 Guru Pengampu' }, modul: 'valid' },
  { kode: 'IND-101', nama: 'Bahasa Indonesia', jenjang: 'Kelas X, XI, XII (Reguler Seluruh Rombel)', ikon: 'bi-book', kelompok: 'Wajib Umum (Fase E & F)', kat: 'wajib', fase: 'E', jp: 4, kktp: 75.0,
    koordinator: { nama: 'Dewi Kartika, S.Pd.', inisial: 'DK', tim: '+4 Guru Pengampu' }, modul: 'valid' },
  { kode: 'INF-204', nama: 'Informatika & Rekayasa Perangkat Lunak', jenjang: 'Kelas XI (Laboratorium Komputer)', ikon: 'bi-pc-display', kelompok: 'Peminatan Sains (Fase F)', kat: 'peminatan', fase: 'F-MIPA', jp: 4, kktp: 76.0,
    koordinator: { nama: 'Ahmad Fauzi, S.Kom.', inisial: 'AF', tim: '+1 Guru Pengampu' }, modul: 'review' },
  { kode: 'MLK-102', nama: 'Bahasa & Budaya Daerah Sunda', jenjang: 'Kelas X, XI, XII (Kurikulum Daerah Jabar)', ikon: 'bi-flower1', kelompok: 'Muatan Lokal', kat: 'mulok', fase: 'mulok', jp: 2, kktp: 74.0,
    koordinator: { nama: 'Dra. Nining Suryati', inisial: 'NS', tim: 'Koordinator Tunggal' }, modul: 'valid' },
  { kode: 'EKO-201', nama: 'Ekonomi Makro & Mikro', jenjang: 'Kelas XI & XII IPS', ikon: 'bi-graph-up', kelompok: 'Peminatan Sosial (Fase F)', kat: 'peminatan', fase: 'F-IPS', jp: 4, kktp: 77.0,
    koordinator: { nama: 'Irwan Setiawan, S.Pd.', inisial: 'IS', tim: '+2 Guru Pengampu' }, modul: 'valid' },
  { kode: 'SOS-203', nama: 'Sosiologi Perubahan Sosial', jenjang: 'Kelas XI IPS', ikon: 'bi-people', kelompok: 'Peminatan Sosial (Fase F)', kat: 'peminatan', fase: 'F-IPS', jp: 3, kktp: 75.0,
    koordinator: { nama: 'Dra. Sri Wahyuni', inisial: 'SW', tim: '+1 Guru Pengampu' }, modul: 'review' },
  { kode: 'ING-103', nama: 'Bahasa Inggris', jenjang: 'Kelas X, XI, XII (Reguler Seluruh Rombel)', ikon: 'bi-translate', kelompok: 'Wajib Umum (Fase E & F)', kat: 'wajib', fase: 'E', jp: 4, kktp: 76.0,
    koordinator: { nama: 'Nurul Diana, S.Pd.', inisial: 'ND', tim: '+3 Guru Pengampu' }, modul: 'valid' },
  { kode: 'PAI-104', nama: 'Pendidikan Agama & Budi Pekerti', jenjang: 'Kelas X, XI, XII', ikon: 'bi-moon-stars', kelompok: 'Wajib Umum (Fase E & F)', kat: 'wajib', fase: 'E', jp: 3, kktp: 80.0,
    koordinator: { nama: 'Drs. Ahmad Zubaidi', inisial: 'AZ', tim: '+2 Guru Pengampu' }, modul: 'valid' },
  { kode: 'MLK-103', nama: 'Seni Tradisi & Karawitan', jenjang: 'Kelas X & XI (Sanggar Seni)', ikon: 'bi-music-note-beamed', kelompok: 'Muatan Lokal', kat: 'mulok', fase: 'mulok', jp: 2, kktp: 75.0,
    koordinator: { nama: 'Asep Sunandar, S.Sn.', inisial: 'AS', tim: 'Koordinator Tunggal' }, modul: 'belum' }
];

const statusModul = {
  valid: { label: 'Modul Ajar Valid 100%', ikon: 'bi-check-circle', kelas: 'ok' },
  review: { label: 'Perlu Review Silabus', ikon: 'bi-clipboard-check', kelas: 'warn' },
  belum: { label: 'Modul Belum Diunggah', ikon: 'bi-exclamation-circle', kelas: 'bad' }
};

const kktp = {
  tahun: 'T.A. 2024/2025',
  batas: 75.0, remedial: 'Maks 2x', bimbingan: 65.0,
  diubah: 'Drs. Bambang S. (28 Juli 2024)'
};

const dapodik = { versi: 'V.2025.c', status: 'Terhubung Lancar', terakhir: 'Hari ini, 06:45 WIB' };

module.exports = { ringkasan, tab, daftar, statusModul, kktp, dapodik, totalTerdaftar: 32 };

// Data dummy halaman Kelas & Rombel
const daftar = [
  { id: 'xii-mipa-1', nama: 'XII MIPA 1', tingkat: 'XII', jenis: 'Unggulan', ruang: 'R.302 Gedung Sains Lt. 2', terisi: 36, kuota: 36,
    wali: { nama: 'Ibu Siti Rahmawati, S.Pd.', nip: '19820412 200501 2 004', inisial: 'SR' }, gender: { l: 18, p: 18 }, capaian: 89.4 },
  { id: 'xii-mipa-2', nama: 'XII MIPA 2', tingkat: 'XII', jenis: 'Reguler', ruang: 'R.303 Gedung Sains Lt. 2', terisi: 35, kuota: 36,
    wali: { nama: 'Hendra Kusuma, M.Si.', nip: '19800815 200604 1 008', inisial: 'HK' }, gender: { l: 17, p: 18 }, capaian: 86.2 },
  { id: 'xii-ips-1', nama: 'XII IPS 1', tingkat: 'XII', jenis: 'Reguler', ruang: 'R.201 Gedung Sosial Lt. 1', terisi: 34, kuota: 36,
    wali: { nama: 'Dra. Sri Wahyuni', nip: '19750322 199903 2 001', inisial: 'SW' }, gender: { l: 16, p: 18 }, capaian: 84.7 },
  { id: 'xii-ips-2', nama: 'XII IPS 2', tingkat: 'XII', jenis: 'Reguler', ruang: 'R.202 Gedung Sosial Lt. 1', terisi: 33, kuota: 36,
    wali: { nama: 'Irwan Setiawan, S.Pd.', nip: '19830709 200801 1 005', inisial: 'IS' }, gender: { l: 15, p: 18 }, capaian: 85.1 },
  { id: 'xi-mipa-1', nama: 'XI MIPA 1', tingkat: 'XI', jenis: 'Unggulan', ruang: 'R.301 Gedung Sains Lt. 2', terisi: 36, kuota: 36,
    wali: { nama: 'Rina Marlina, S.Si.', nip: '19790430 200212 2 003', inisial: 'RM' }, gender: { l: 17, p: 19 }, capaian: 88.0 },
  { id: 'x-1', nama: 'X-1', tingkat: 'X', jenis: 'Reguler', ruang: 'R.101 Gedung Utama Lt. 1', terisi: 34, kuota: 36,
    wali: { nama: 'Agus Prasetyo, S.Pd.', nip: '19850218 200901 1 004', inisial: 'AP' }, gender: { l: 18, p: 16 }, capaian: 83.5 }
];

const tab = [
  { key: 'semua', label: 'Semua (24)' }, { key: 'XII', label: 'Kelas XII (8)' },
  { key: 'XI', label: 'Kelas XI (8)' }, { key: 'X', label: 'Kelas X (8)' }
];

const ringkasan = {
  rombel: { total: 24, X: 8, XI: 8, XII: 8 },
  siswa: { terplotting: 810, total: 810, persen: 100 },
  kapasitas: { rata: 33.8, maks: 36 },
  wali: { terisi: 24, total: 24 }
};

const pool = [
  { nama: 'Raditya Arya Pratama', jk: 'L', hadir: 98.4, nilai: 88.6, peran: 'Ketua Kelas' },
  { nama: 'Nabila Dwi Ananda', jk: 'P', hadir: 99.1, nilai: 95.0, peran: 'Wakil Ketua' },
  { nama: 'Ahmad Rian Hidayat', jk: 'L', hadir: 97.0, nilai: 87.0, peran: 'Sekretaris 1' },
  { nama: 'Clarissa Aurelia Putri', jk: 'P', hadir: 96.5, nilai: 86.5, peran: 'Sekretaris 2' },
  { nama: 'Daffa Fauzan', jk: 'L', hadir: 95.0, nilai: 83.0, peran: 'Bendahara 1' }
];

// Anggota dummy per rombel. Ganti dengan data dari backend.
function anggotaDari(r) {
  const idx = daftar.indexOf(r);
  const dasar = [64829104, 65192841, 63920194, 67784310, 67471928];
  return pool.map((s, i) => ({
    ...s,
    nisn: String(dasar[i] + idx * 137).padStart(10, '0'),
    nilai: +(s.nilai - idx * 0.4).toFixed(1),
    tuntas: s.nilai - idx * 0.4 >= 75
  }));
}

module.exports = { daftar, tab, ringkasan, anggotaDari };

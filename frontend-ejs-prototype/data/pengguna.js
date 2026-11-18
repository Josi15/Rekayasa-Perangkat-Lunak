// Data dummy halaman Manajemen Pengguna
module.exports = {
  ringkasan: [
    { label: 'Total akun aktif', angka: 876, satuan: 'Pengguna', icon: 'bi-person-vcard', foot: '99.2% Terverifikasi SSO', footIcon: 'bi-shield-check', hijau: true },
    { label: 'Siswa terdaftar', angka: 810, satuan: 'Siswa', icon: 'bi-mortarboard', foot: '24 Rombel X-XII', footIcon: 'bi-journal' },
    { label: 'Guru & tendik', angka: 54, satuan: 'Pendidik', icon: 'bi-person-lines-fill', foot: '100% NUPTK Valid', footIcon: 'bi-check-circle', hijau: true },
    { label: 'Admin & staf TU', angka: 12, satuan: 'Akun', icon: 'bi-person-gear', foot: '2FA Terlindungi', footIcon: 'bi-shield-lock' }
  ],
  tab: [
    { key: 'semua', label: 'Semua', jumlah: 876 },
    { key: 'siswa', label: 'Siswa', jumlah: 810 },
    { key: 'guru', label: 'Guru Pengampu', jumlah: 54 },
    { key: 'staf', label: 'Staf TU', jumlah: 12 }
  ],
  daftarPengguna: [
    { id: 'USR-G-8201', inisial: 'SR', nama: 'Ibu Siti Rahmawati, S.Pd.', sub: 'Tenaga Pendidik Tetap', nomor: '198204122005012004', labelNomor: 'NIP Nasional', surel: 'siti.rahmawati@sman1.sch.id', peran: 'Guru Pengampu', tipe: 'guru', kelas: 'Wali Kelas XII MIPA 1 (Biologi)', aktif: true },
    { id: 'USR-S-0678', inisial: 'RA', nama: 'Raditya Arya Pratama', sub: 'Peserta Didik Aktif', nomor: '0064829104', labelNomor: 'NISN Kemendikbud', surel: 'raditya.pratama@siswa.sman1.sch.id', peran: 'Siswa', tipe: 'siswa', kelas: 'XII MIPA 1 (No. Absen 28)', aktif: true },
    { id: 'USR-A-8901', inisial: 'BS', nama: 'Drs. Bambang Sutrisno, M.Pd.', sub: 'Pimpinan Satdik', nomor: '197405201999031002', labelNomor: 'NIP Nasional', surel: 'bambang.sutrisno@sman1.sch.id', peran: 'Admin IT / TU', tipe: 'staf', kelas: 'Kepala TU & Kurikulum', aktif: true },
    { id: 'USR-G-7405', inisial: 'HK', nama: 'Hendra Kusuma, M.Si.', sub: 'Tenaga Pendidik Tetap', nomor: '198008152006041008', labelNomor: 'NIP Nasional', surel: 'hendra.k@sman1.sch.id', peran: 'Guru Pengampu', tipe: 'guru', kelas: 'Wali Kelas XII MIPA 2 (Fisika)', aktif: true },
    { id: 'USR-S-0689', inisial: 'CA', nama: 'Clarissa Aurelia Putri', sub: 'Peserta Didik Aktif', nomor: '0067784310', labelNomor: 'NISN Kemendikbud', surel: 'clarissa.l@siswa.sman1.sch.id', peran: 'Siswa', tipe: 'siswa', kelas: 'XII MIPA 1 (No. Absen 04)', aktif: true }
  ],
  paginasi: { dari: 1, sampai: 5, total: 876, halaman: 88 },
  opsiPeran: ['Guru Pengampu Mata Pelajaran', 'Siswa', 'Staf Tata Usaha', 'Admin IT / TU']
};

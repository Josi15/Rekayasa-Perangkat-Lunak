// Data dummy. Nanti ganti dengan data dari API/controller backend.
module.exports = {
  user: { nama: 'Drs. Bambang S., M.Pd.', peran: 'Super Admin / Kepala TU' },
  menu: [
    { key: 'dashboard', label: 'Dashboard Admin', icon: 'bi-grid-1x2', href: '/admin/dashboard' },
    { key: 'pengguna', label: 'Manajemen Pengguna', icon: 'bi-people', href: '/admin/pengguna' },
    { key: 'kelas', label: 'Kelas & Rombel', icon: 'bi-door-open', href: '/admin/rombel' },
    { key: 'mapel', label: 'Mata Pelajaran & Kurikulum', icon: 'bi-journal-bookmark', href: '/admin/mapel' },
    { key: 'jadwal', label: 'Jadwal & Kalender KBM', icon: 'bi-calendar3', href: '/admin/jadwal' },
    { key: 'materi', label: 'Materi & Silabus Satdik', icon: 'bi-folder2-open', href: '/admin/materi' },
    { key: 'tugas', label: 'Bank Tugas & Evaluasi', icon: 'bi-clipboard-check', href: '/admin/tugas' },
    { key: 'kuis', label: 'Kuis Form & CBT', icon: 'bi-patch-question', href: '/admin/kuis' },
    { key: 'presensi', label: 'Monitoring Presensi', icon: 'bi-card-checklist', href: '/admin/presensi' },
    { key: 'sistem', label: 'Pengaturan Sistem & Backup', icon: 'bi-gear', href: '/admin/sistem' }
  ],
  stats: {
    pengguna: { total: 876, siswa: 810, guru: 54, tendik: 12 },
    rombel: { total: 24, catatan: 'Tingkat X, XI, XII terisi seimbang' },
    presensi: { persen: 97.8 }
  },
  sesi: [
    { tingkat: 'XII', kelas: 'XII MIPA 1', mapel: 'Biologi Molekuler', guru: 'Ibu Siti Rahmawati, M.Pd.', nip: '198204122005012004', ruang: 'Lab Biologi 2', hadir: 34, total: 36, ket: '2 Izin' },
    { tingkat: 'XI', kelas: 'XI IPS 2', mapel: 'Sosiologi Perubahan', guru: 'Pak Hendra Wijaya, S.Sos.', nip: '197809152003121002', ruang: 'Ruang Teori 204', hadir: 35, total: 36, ket: '1 Sakit' },
    { tingkat: 'X', kelas: 'X-4', mapel: 'Matematika Diskrit', guru: 'Dra. Ratna Purwanti', nip: '197405101999032001', ruang: 'Ruang Teori 102', hadir: 36, total: 36, ket: 'Lengkap' }
  ],
  dapodik: {
    tahun: '2025.c', status: 'Terhubung', sumber: 'Pusdatin Kemendikbudristek RI',
    sinkron: 'Hari ini, 08:30 WIB', konektor: 'REST v2.4 (Aktif)',
    item: [
      { label: 'Data Peserta Didik', nilai: '810 Valid' },
      { label: 'Data Pendidik & Tenaga (PTK)', nilai: '66 Valid' },
      { label: 'SK Rombongan Belajar (Rombel)', nilai: '24 Rombel' }
    ]
  },
  antrean: [
    { inisial: 'AR', nama: 'Ahmad Rizky Pratama', tag: 'Siswa Baru', tipe: 'siswa', info: 'NISN: 0071982121 • Kelas X-2 • Didaftarkan 15 menit lalu' },
    { inisial: 'ND', nama: 'Nurul Diana, S.Pd.', tag: 'Guru Pengampu', tipe: 'guru', info: 'NUPTK: 49301294812 • Bahasa Inggris • Menunggu Aktivasi 2FA' },
    { inisial: 'BA', nama: 'Budi Anugrah, A.Md.', tag: 'Staf Laboratorium', tipe: 'tendik', info: 'NIP: 198902032014021001 • Lab Komputer CBT • Permintaan Hak AI' }
  ],
  aksiCepat: [
    { judul: 'Tambah Akun Massal', desk: 'Import template format CSV / Excel', icon: 'bi-file-earmark-arrow-up' },
    { judul: 'Generate Token CBT Pengawas', desk: 'Perbarui token acak berkala 15 menit', icon: 'bi-key' },
    { judul: 'Backup Database Harian', desk: 'Dump berkas arsip .SQL terenkripsi', icon: 'bi-cloud-arrow-up' }
  ],
  pengumuman: {
    kode: 'PENGUMUMAN AKADEMIK #2025/GENAP-04', waktu: 'Kemarin, 14:00 WIB',
    judul: 'Jadwal Ujian Tengah Semester & Petunjuk CBT Berbasis Browser Aman',
    isi: 'Diberitahukan kepada seluruh peserta didik kelas X, XI, dan XII bahwa simulasi CBT akan dilaksanakan serentak mulai hari Kamis melalui portal SIMBA. Pastikan aplikasi Safe Exam Browser versi 3.2 telah terpasang pada perangkat masing-masing.',
    dibaca: 842, total: 876
  }
};

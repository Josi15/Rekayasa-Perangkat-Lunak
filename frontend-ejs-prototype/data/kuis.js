// Data dummy halaman Pusat Integrasi Asesmen Kuis Form & CBT. Ganti dengan data backend.
module.exports = {
  ringkasan: [
    { label: 'Sesi Asesmen Aktif', nilai: '6 Sesi', icon: 'bi-broadcast', ket: '1,042 siswa sedang LIVE', ketIcon: 'dot' },
    { label: 'Integritas & Anti-Cheat', nilai: '99.7%', icon: 'bi-shield-fill-check', ket: 'Deteksi tab & multi-device aman', ketIcon: 'bi-check-circle', gray: true },
    { label: 'Nilai Tersinkronisasi Otomatis', nilai: '18,420', icon: 'bi-arrow-repeat', ket: '100% Masuk ke Buku Leger', ketIcon: 'bi-journal-check' },
    { label: 'Bank Token Ujian Aktif', nilai: '12 Token', icon: 'bi-key', ket: 'Rotasi dinamis tiap 30 menit', ketIcon: 'bi-clock-history', gray: true }
  ],
  tab: [
    { key: '', label: 'Semua Asesmen', n: 24 },
    { key: 'live', label: 'Sedang Berlangsung LIVE', n: 6, dark: true },
    { key: 'terjadwal', label: 'Terjadwal', n: 10 },
    { key: 'selesai', label: 'Selesai & Tersinkron', n: 8 }
  ],
  platform: { forms: { label: 'Google Forms API', icon: 'bi-file-earmark-text' }, cbt: { label: 'CBT Terenkripsi SIMBA', icon: 'bi-terminal' } },
  asesmen: [
    { status: 'live', nama: 'Asesmen Formatif 3: Gelombang Elektromagnetik', kode: 'KUIS-FIS-12', mapel: 'Fisika Lanjutan', platform: 'forms', token: 'SIMBA-78X2', peserta: '34 / 36' },
    { status: 'live', nama: 'PTS Gasal 2024: Biologi Sel & Genetika', kode: 'PTS-BIO-12', mapel: 'Penilaian Tengah Semester', platform: 'cbt', token: 'SMAN1-KBM9', peserta: '72 / 72' },
    { status: 'terjadwal', nama: 'Ulangan Harian 2: Senyawa Hidrokarbon', kode: 'UH-KIM-11', mapel: 'Kimia Dasar', platform: 'forms', token: null, tokenKet: '(Belum Dibuka)' },
    { status: 'terjadwal', nama: 'Simulasi AKM Numerasi Satdik', kode: 'AKM-NUM-10', mapel: 'Literasi & Numerasi', platform: 'cbt', token: null, tokenKet: '(Auto-Gen 12:45)' },
    { status: 'selesai', nama: 'Kuis Singkat: Hukum Newton', kode: 'KUIS-FIS-10', mapel: 'Fisika Dasar', platform: 'forms', token: null, tokenKet: '(Kedaluwarsa)', peserta: '35 / 36' },
    { status: 'selesai', nama: 'PH 1: Persamaan Kuadrat', kode: 'PH-MAT-10', mapel: 'Matematika Wajib', platform: 'cbt', token: null, tokenKet: '(Kedaluwarsa)', peserta: '70 / 72' },
    { status: 'terjadwal', nama: 'Kuis Interaktif: Sistem Pencernaan', kode: 'KUIS-BIO-11', mapel: 'Biologi', platform: 'forms', token: null, tokenKet: '(Belum Dibuka)' },
    { status: 'live', nama: 'Tryout UTBK: Penalaran Umum', kode: 'TO-UTBK-12', mapel: 'Tryout Satdik', platform: 'cbt', token: 'UTBK-4PQ7', peserta: '140 / 144' }
  ],
  statusLabel: { live: 'LIVE BERLANGSUNG', terjadwal: 'TERJADWAL', selesai: 'SELESAI' },
  total: 24, ukuran: 4,
  sesiBerjalan: ['PTS Gasal: Biologi Sel & Genetika (Kls XII)', 'Asesmen Formatif 3: Gelombang Elektromagnetik (Kls XII)', 'Tryout UTBK: Penalaran Umum (Kls XII)'],
  log: [
    { tipe: 'nilai', judul: 'Nilai Diterima: 92/100', waktu: 'Baru saja', nama: 'Ahmad Raihan (XII MIPA 2)', ket: 'Formatif 3 Gelombang (Forms)', hasil: 'Leger OK' },
    { tipe: 'nilai', judul: 'Nilai Diterima: 88/100', waktu: '1m lalu', nama: 'Siti Nurhaliza (XII MIPA 1)', ket: 'PTS Gasal Biologi (CBT)', hasil: 'Leger OK' },
    { tipe: 'token', judul: 'Token Rotated', waktu: '4m lalu', nama: 'Rotasi Berkala CBT XII', ket: 'Sistem mengunci sesi ID #8812' },
    { tipe: 'nilai', judul: 'Nilai Diterima: 78/100', waktu: '6m lalu', nama: 'Dimas Aditya (XII MIPA 3)', ket: 'Formatif 3 Gelombang (Forms)', hasil: 'Leger OK' }
  ]
};

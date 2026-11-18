const express = require('express');
const path = require('path');
const data = require('./data/dummy');
const pengguna = require('./data/pengguna');
const rombel = require('./data/rombel');
const presensi = require('./data/presensi');
const mapel = require('./data/mapel');
const jadwal = require('./data/jadwal');
const materi = require('./data/materi');
const tugas = require('./data/tugas');
const sistem = require('./data/sistem');
const kuis = require('./data/kuis');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Halaman 1: Dashboard Admin
app.get('/', (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin/dashboard', (req, res) => {
  res.render('dashboard', { title: 'Kontrol Administrator', active: 'dashboard', ...data });
});

// Halaman 2: Manajemen Pengguna
app.get('/admin/pengguna', (req, res) => {
  res.render('pengguna', { title: 'Direktori & Manajemen Pengguna Sekolah', active: 'pengguna', ...data, ...pengguna });
});

// Halaman 3: Kelas & Rombel (pilih rombel lewat ?id=xii-mipa-2)
app.get('/admin/rombel', (req, res) => {
  const aktif = rombel.daftar.find(r => r.id === req.query.id) || rombel.daftar[0];
  res.render('rombel', {
    title: 'Manajemen Kelas & Alokasi Anggota Rombel', active: 'kelas',
    ...data, ...rombel, aktif, anggota: rombel.anggotaDari(aktif)
  });
});

// Halaman 4: Monitoring Presensi
app.get('/admin/presensi', (req, res) => {
  res.render('presensi', { title: 'Monitoring Presensi Realtime & Audit Kehadiran Sekolah', active: 'presensi', ...data, ...presensi });
});

// Halaman 5: Mata Pelajaran & Kurikulum
app.get('/admin/mapel', (req, res) => {
  res.render('mapel', { title: 'Manajemen Mata Pelajaran & Kurikulum', active: 'mapel', ...data, ...mapel });
});

// Halaman 6: Jadwal & Kalender KBM
app.get('/admin/jadwal', (req, res) => {
  res.render('jadwal', { title: 'Jadwal Sekolah & Kalender KBM', active: 'jadwal', ...data, ...jadwal });
});

// Halaman 7: Materi & Silabus (Master Bank Materi)
app.get('/admin/materi', (req, res) => {
  res.render('materi', { title: 'Master Bank Materi, Modul Ajar', active: 'materi', ...data, ...materi });
});

// Halaman 8: Bank Tugas & Monitoring Evaluasi
app.get('/admin/tugas', (req, res) => {
  res.render('tugas', { title: 'Bank Tugas & Monitoring Evaluasi Siswa Seluruh Satdik', active: 'tugas', ...data, ...tugas });
});

// Halaman 9: Konfigurasi Satdik & Keamanan Data
app.get('/admin/sistem', (req, res) => {
  res.render('sistem', { title: 'Konfigurasi Satdik & Keamanan Data', active: 'sistem', ...data, ...sistem });
});

// Halaman 10: Kuis Form & CBT
app.get('/admin/kuis', (req, res) => {
  res.render('kuis', { title: 'Pusat Integrasi Asesmen Kuis Form & CBT Sekolah', active: 'kuis', ...data, ...kuis });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SIMBA jalan di http://localhost:${PORT}`));

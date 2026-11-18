// Data dummy halaman Monitoring Presensi
module.exports = {
  strip: { batas: '07:00 WIB', zona: 'WIB (UTC+7)', audit: 'Tiap 30 Detik' },
  kartu: {
    siswa: { persen: 98.4, naik: '+0.6%', hadir: 797, total: 810, izin: 8, sakit: 3, alpa: 2 },
    gtk: { persen: 100, guru: 42, tendik: 12 },
    gps: { persen: 94.8, radius: 'Radius 50m Kampus SMA 1 Teladan' },
    anomali: { jumlah: 0 }
  },
  tingkat: [
    { nama: 'Tingkat Sepuluh (Fase E)', rombel: 9, hadir: 268, total: 270, persen: 99.2, tone: 1, ket: [['Izin', 1], ['Sakit', 1], ['Alpa', 0]] },
    { nama: 'Tingkat Sebelas (Fase F - Madya)', rombel: 9, hadir: 269, total: 270, persen: 99.6, tone: 2, ket: [['Dispensasi Lomba', 1], ['Sakit', 0], ['Alpa', 0]] },
    { nama: 'Tingkat Dua Belas (Fase F - Akhir)', rombel: 9, hadir: 260, total: 270, persen: 96.3, tone: 3, ket: [['Izin', 6], ['Sakit', 2], ['Alpa', 2]] }
  ],
  infra: [
    { nama: 'RFID Gate Utama (4 Jalur)', desk: 'Gate Barat & Timur Latensi 12ms', status: 'Online', tone: 'ok', icon: 'bi-broadcast' },
    { nama: 'Geofence Radius 50m', desk: 'Polygon Kampus Presisi 0.8m', status: 'Aktif', tone: 'ok', icon: 'bi-bullseye' },
    { nama: 'Konektor Dapodik', desk: 'Sync API Pusdatin Kemendikbud', status: 'Standby', tone: 'idle', icon: 'bi-arrow-left-right' }
  ],
  ssid: { nama: 'SMAN1-TELADAN-SECURE', sandi: 'WPA3-Enterprise' },
  tab: [
    { key: 'konfirmasi', label: 'Perlu Konfirmasi / Izin & Sakit', jumlah: 11, tone: 'ok' },
    { key: 'belum', label: 'Siswa Belum Presensi', jumlah: 2, tone: 'bad' },
    { key: 'semua', label: 'Seluruh Presensi Hari Ini', jumlah: 810, tone: '' }
  ],
  // kat: konfirmasi | belum | lain  (menentukan tampil di tab mana)
  kasus: [
    { inisial: 'AP', nama: 'Aurelia Amanda Putri', rombel: 'XII IPS 3 (No. Absen 07)', nisn: '0867471928', waktu: '07:05 WIB', metode: 'Portal Siswa', metodeIcon: 'bi-phone',
      status: 'Izin Sakit (Demam)', statusTone: 'bad', lampiran: 'Surat_Dokter_Klinik.pdf', verif: 'Menunggu Verifikasi BK', verifTone: 'wait', verifIcon: 'bi-three-dots', aksi: 'setujui', kat: 'konfirmasi' },
    { inisial: 'DW', nama: 'Dimas Anggoro Wicaksono', rombel: 'XI IPS 1 (No. Absen 12)', nisn: '0071829910', waktu: '06:42 WIB', metode: 'Geofence GPS', metodeIcon: 'bi-geo-alt',
      status: 'Dispensasi OSN Astronomi', statusTone: 'ok', lampiran: 'Surat_Tugas_Kepsek.pdf', verif: 'Disetujui Wali Kelas', verifTone: 'ok', verifIcon: 'bi-check-circle', aksi: '', kat: 'konfirmasi' },
    { inisial: 'RF', nama: 'Rizky Fajar Ramadhan', rombel: 'XII IPS 2 (No. Absen 26)', nisn: '0061928341', waktu: '--:-- WIB', metode: 'Melewati Batas 07:00', metodeIcon: 'bi-wifi-off', telat: true,
      status: 'Alpa / Tanpa Keterangan', statusTone: 'bad', lampiran: '', verif: 'Eskalasi ke Guru BK', verifTone: 'bad', verifIcon: 'bi-exclamation-triangle', aksi: 'hubungi', kat: 'belum' },
    { inisial: 'SR', nama: 'Siti Rahmawati Salsabila', rombel: 'X MIPA 1 (No. Absen 31)', nisn: '0079201948', waktu: '06:28 WIB', metode: 'RFID Gate 1', metodeIcon: 'bi-broadcast',
      status: 'Hadir Tepat Waktu', statusTone: 'ok', lampiran: 'Log Biometrik SSID Valid', lampiranTeks: true, verif: 'Otomatis Terverifikasi', verifTone: 'ok', verifIcon: 'bi-check-circle', aksi: '', kat: 'lain' }
  ],
  opsiRombel: ['XII IPS 3', 'XII IPS 2', 'XI IPS 1', 'X MIPA 1']
};

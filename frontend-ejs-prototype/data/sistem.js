// Data dummy halaman Konfigurasi Satdik & Keamanan Data. Ganti dengan data backend.
module.exports = {
  status: [
    { icon: 'bi-lock', label: 'Protokol Keamanan Aktif', nilai: 'TLS 1.3 & AES-256-GCM', dot: true },
    { icon: 'bi-patch-check', label: 'Hash Integrasi BSSN', nilai: 'Tervalidasi (SHA-512 Signed)', badge: 'VALID' },
    { icon: 'bi-hdd-rack', label: 'Status Server Master Node', nilai: 'Normal • Uptime 99.98%', latensi: '18ms' }
  ],
  tab: [
    { key: 'profil', label: 'Profil Sekolah & Legalitas', icon: 'bi-bank' },
    { key: 'tahun', label: 'Tahun Ajaran & Semester', icon: 'bi-calendar3' },
    { key: 'api', label: 'Integrasi API & Dapodik', icon: 'bi-arrow-left-right' },
    { key: 'keamanan', label: 'Keamanan & Autentikasi 2FA', icon: 'bi-shield-check' },
    { key: 'backup', label: 'Backup & Pemulihan', icon: 'bi-database-gear' }
  ],
  sekolah: {
    nama: 'SMAN 1 Teladan Jakarta', singkat: 'SMAN 1 TELADAN', jenjangLabel: 'Satuan Pendidikan Tingkat Menengah Atas',
    akreditasi: 'Akreditasi A (Unggul BAN-S/M)', jenjang: 'Jenjang SMA Reguler',
    npsn: '20108920', zona: 'Asia/Jakarta (WIB - UTC+7)',
    kepsek: 'Dr. Hj. Nur Aini, M.Ed.', nip: '19680315 199203 2 004',
    alamat: 'Jl. Pendidikan No. 76, RT 04 / RW 07, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12160',
    telp: '(021) 789-2024', email: 'sekretariat@sman1.sch.id', web: 'https://sman1teladan-jkt.sch.id', domain: '@sman1.sch.id',
    bentuk: 'Sekolah Menengah Atas', status: 'Negeri Pembina', sk: '420/1982/DISDIK',
    sinkron: 'Hari ini 08:30 WIB',
    foto: { judul: 'Gedung Utama SMAN 1 Teladan', wilayah: 'DKI Jakarta', caption: 'Gedung Ki Hajar Dewantara, Kampus A', lat: '-6.2415° S', lng: '106.8012° E' },
    sertifikat: { berlaku: '14 Nov 2025' }
  },
  backup: {
    judul: 'Modul Backup Otomatis & Pemulihan Basis Data Cepat',
    ket: 'Manajemen retensi snapshot harian, dump SQL terenkripsi, replikasi off-site, dan pengujian gateway SSO.',
    kartu: [
      { icon: 'bi-alarm', label: 'Jadwal Otomatis', judul: 'Snapshot Harian Pukul 23:59 WIB',
        isi: 'Menyimpan cadangan inkremental seluruh basis data nilai, rapor K13/Merdeka, presensi siswa, serta repositori bahan ajar.',
        foot: 'Snapshot terakhir:', fv: 'Kemarin 23:59', extra: 'Tersimpan (1.84 GB)' },
      { icon: 'bi-lock', label: 'Enkripsi Berkas', judul: 'Standar AES-GCM 256-Bit',
        isi: 'Setiap file cadangan ditandatangani kunci asimetris institusi untuk menjamin integritas data saat pemulihan darurat (Disaster Recovery).',
        foot: 'Algoritma Checksum:', fv: 'SHA-256 Valid', mono: true },
      { icon: 'bi-key', label: 'SSO Kemendikbudristek', judul: 'OIDC & Belajar.id Terhubung',
        isi: 'Otentikasi tunggal aktif untuk 78 Dewan Guru & 1.042 akun siswa. Token OAuth 2.0 diperbarui otomatis setiap 4 jam.',
        foot: 'Status Sinkron Token:', fv: 'Sinkron Aktif', ok: true }
    ]
  }
};

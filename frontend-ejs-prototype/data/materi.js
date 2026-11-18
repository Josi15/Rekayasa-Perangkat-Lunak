// Data dummy halaman Master Bank Materi. Ganti dengan data backend.
module.exports = {
  ringkasan: {
    arsip: { total: 486, ket: 'Dokumen Modul (Fase E & Fase F)' },
    validasi: { persen: 94.2, antrean: 28 },
    unduhan: { total: '14,280', naik: '+18.4%' }
  },
  opsi: {
    tingkat: ['X', 'XI', 'XII'],
    mapel: ['Fisika', 'Biologi', 'Informatika', 'Kimia'],
    status: [{ v: 'verified', l: 'Terverifikasi' }, { v: 'revisi', l: 'Perlu Revisi' }]
  },
  // urutan: makin besar makin baru (dipakai tombol "Urutkan")
  modul: [
    { urutan: 4, icon: 'bi-lightning-charge', warna: 'green', status: 'verified', label: 'Terverifikasi Kurikulum Merdeka', mapel: 'Fisika', fase: 'Fisika Fase F (XII MIPA)', tingkat: 'XII',
      judul: 'Modul Ajar 04: Dinamika Fluida & Termodinamika', penyusun: 'Drs. Bambang Subagyo, M.Pd.', berkas: '14.8 MB (PDF + PPTX)', berkasIcon: 'bi-paperclip', unduh: 324 },
    { urutan: 3, icon: 'bi-heart-pulse', warna: 'bright', status: 'verified', label: 'Terverifikasi', mapel: 'Biologi', fase: 'Biologi Fase F (XII MIPA)', tingkat: 'XII',
      judul: 'Modul Ajar 03: Rekayasa Genetika & Bioteknologi', penyusun: 'Siti Rahmawati, S.Pd.', berkas: '22.4 MB (Paket Berkas & Rubrik)', berkasIcon: 'bi-folder2', unduh: 412 },
    { urutan: 2, icon: 'bi-terminal', warna: 'gray', status: 'verified', label: 'Terverifikasi', mapel: 'Informatika', fase: 'Informatika Fase E (Kelas X)', tingkat: 'X',
      judul: 'Bahan Ajar Koding & Struktur Data Python', penyusun: 'Rian Pratama, S.Kom.', berkas: '8.5 MB (Jupyter & PDF)', berkasIcon: 'bi-braces', unduh: 688 },
    { urutan: 1, icon: 'bi-droplet-half', warna: 'pink', status: 'revisi', label: 'Perlu Revisi Capaian TP', mapel: 'Kimia', fase: 'Kimia Fase F (XI MIPA)', tingkat: 'XI',
      judul: 'Modul Ajar: Stoikiometri Larutan', penyusun: 'Dra. Hj. Nurul Hidayah', catatan: 'Catatan Review: Penyesuaian Asesmen Diagnostik' }
  ],
  paginasi: { dari: 1, sampai: 4, total: 486, halaman: 122 },
  antrean: [
    { judul: 'Geografi Sosial & Dinamika Kependudukan', info: 'Fase E • Dian Lestari, M.Si.', waktu: 'Hari ini' },
    { judul: 'Kalkulus Lanjut: Integral Tentu', info: 'Matematika Fase F • Agus Haryanto, S.Pd.', waktu: 'Kemarin' },
    { judul: 'Teks Eksplanasi & Kritik Sastra', info: 'B. Indonesia Fase E • Nur Halimah, M.Pd.', waktu: '2 hari lalu' }
  ],
  antreanTotal: 28,
  pedoman: {
    gambar: 'Panduan Penyusunan Modul Ajar Satdik SMAN 1',
    butir: [
      'Memuat Komponen Inti: Tujuan, Pemahaman Bermakna, Pertanyaan Pemantik, Asesmen Diagnostik.',
      'Integrasi Profil Pelajar Pancasila (P5) pada setiap rancangan kegiatan KBM mandiri.',
      'Format berkas: PDF dokumen utama & lampiran presentasi LKPD dalam format terbuka.'
    ],
    waka: { inisial: 'WK', nama: 'Dr. Hendra Saputra, M.Pd.' }
  }
};

<?php

/*
| Tugas & pengumpulan (Backend 6).
|
| Disk bawaan "local" PRIVAT (tanpa symlink public/storage). Lampiran tugas dan jawaban siswa hanya
| keluar lewat endpoint unduhan yang memeriksa izin. Jangan arahkan TUGAS_DISK ke disk "public".
*/
return [
    'disk' => env('TUGAS_DISK', 'local'),

    // File disimpan sebagai {direktori}/{id}/{uuid}.{ekstensi}.
    'direktori_lampiran' => 'tugas/lampiran',   // + /{id_mapel}
    'direktori_jawaban' => 'tugas/jawaban',     // + /{id_tugas}

    'maks_kb_lampiran' => (int) env('TUGAS_LAMPIRAN_MAX_KB', 20480),
    'maks_kb_jawaban' => (int) env('TUGAS_JAWABAN_MAX_KB', 20480),

    /*
    | Aturan setelah tenggat. 0 (bawaan) = TEGAS: pengumpulan & revisi ditolak sesudah batas_waktu (409).
    | N > 0 = toleransi N jam: pengumpulan setelah batas_waktu tetapi dalam N jam diterima dengan
    | status "terlambat"; sesudahnya ditolak. Dipakai oleh App\Models\Tugas::batasAkhir().
    */
    'toleransi_terlambat_jam' => (int) env('TUGAS_TOLERANSI_JAM', 0),

    // Daftar putih: tipe MIME (deteksi ISI file di server) => ekstensi penyimpanan.
    'jenis' => [
        'application/pdf' => 'pdf',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'application/vnd.ms-powerpoint' => 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
        'application/vnd.ms-excel' => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        'text/plain' => 'txt',
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
    ],
];

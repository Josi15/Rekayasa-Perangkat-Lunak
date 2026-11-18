<?php

/*
| Penyimpanan file materi (Backend 5).
|
| Disk bawaan "local" bersifat PRIVAT (root storage/app/private; tidak ada symlink public/storage).
| File materi TIDAK PERNAH dilayani langsung oleh web server: hanya lewat endpoint
| GET /api/v1/materi/{id}/file yang memeriksa izin. Jangan arahkan MATERI_DISK ke disk "public".
*/
return [
    'disk' => env('MATERI_DISK', 'local'),

    // Direktori dasar pada disk; file disimpan sebagai {direktori}/{id_mapel}/{uuid}.{ekstensi}.
    'direktori' => 'materi',

    // Ukuran maksimum per file (KB). Selaraskan dengan upload_max_filesize & post_max_size di php.ini.
    'maks_kb' => (int) env('MATERI_MAX_KB', 20480),

    // Daftar putih: tipe MIME (hasil deteksi ISI file di server, bukan nama dari pengguna) => ekstensi
    // yang dipakai untuk menyimpan. Tipe lain ditolak.
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

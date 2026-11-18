<?php

/*
| Jadwal & presensi (Backend 8).
|
| PENTING — nilai bawaan di bawah adalah ASUMSI, bukan aturan sekolah. Sekolah perlu menetapkan titik
| referensi, radius, jendela check-in, dan toleransi keterlambatan lalu mengisinya lewat .env.
|
| Validasi lokasi: jarak dihitung di server (rumus haversine) dari koordinat yang dikirim perangkat.
| Koordinat GPS/jaringan dari perangkat TIDAK sepenuhnya kebal pemalsuan (aplikasi "mock location",
| emulator, perangkat ber-root, VPN/spoofing). Validasi ini hanya mengurangi kecurangan yang tidak
| disengaja/mudah; ia bukan bukti kehadiran fisik. Guru/admin dapat mengoreksi status kehadiran.
*/
return [
    // Hari pada filter tanggal (tanggal=, dari=, sampai=) dihitung pada zona waktu ini.
    'zona_waktu' => env('PRESENSI_ZONA_WAKTU', 'Asia/Jakarta'),

    'lokasi' => [
        // Titik referensi (mis. gerbang sekolah). Kosong = lokasi belum dikonfigurasi.
        'lat' => env('PRESENSI_LAT') !== null && env('PRESENSI_LAT') !== '' ? (float) env('PRESENSI_LAT') : null,
        'lng' => env('PRESENSI_LNG') !== null && env('PRESENSI_LNG') !== '' ? (float) env('PRESENSI_LNG') : null,
        'radius_meter' => (int) env('PRESENSI_RADIUS_METER', 100),

        // true  = check-in WAJIB menyertakan koordinat (izin lokasi harus diberikan).
        // false = tanpa koordinat tetap diterima dengan status_validasi_lokasi "belum_divalidasi".
        'wajib' => filter_var(env('PRESENSI_LOKASI_WAJIB', true), FILTER_VALIDATE_BOOL),

        // Di luar radius: "tolak" (409 outside_radius, tidak disimpan) atau
        // "tandai" (disimpan dengan status_validasi_lokasi "tidak_valid" untuk ditinjau guru/admin).
        'luar_radius' => env('PRESENSI_LUAR_RADIUS', 'tolak'),
    ],

    'checkin' => [
        // Check-in dibuka N menit sebelum waktu_mulai dan ditutup pada waktu_selesai.
        'buka_sebelum_menit' => (int) env('PRESENSI_BUKA_SEBELUM_MENIT', 15),
        // Check-in sampai N menit setelah waktu_mulai = "hadir"; lebih dari itu = "terlambat".
        'toleransi_terlambat_menit' => (int) env('PRESENSI_TOLERANSI_MENIT', 10),
    ],

    'jadwal' => [
        'durasi_min_menit' => (int) env('JADWAL_DURASI_MIN_MENIT', 10),
        'durasi_maks_menit' => (int) env('JADWAL_DURASI_MAKS_MENIT', 480),
    ],

    'rekap' => [
        'maks_hari' => (int) env('PRESENSI_REKAP_MAKS_HARI', 366),
    ],
];

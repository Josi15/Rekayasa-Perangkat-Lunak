<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Frontend (SPA) yang disajikan Laravel
    |--------------------------------------------------------------------------
    | Lokasi index.html hasil build React (disalin ke public/ oleh scripts/build-frontend.sh).
    | Bukan rahasia; diubah lewat env hanya untuk tes atau tata letak khusus.
    */
    'index_path' => env('SPA_INDEX_PATH', public_path('index.html')),
];

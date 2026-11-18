<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Versi API
    |--------------------------------------------------------------------------
    | Prefix versi didefinisikan di routes/api.php. Nilai ini hanya dipakai untuk
    | informasi pada respons health check.
    */
    'version' => 'v1',

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    | Dipakai oleh App\Http\Requests\Api\PaginationRequest (?page=&per_page=).
    */
    'pagination' => [
        'default_per_page' => (int) env('API_DEFAULT_PER_PAGE', 15),
        'max_per_page' => (int) env('API_MAX_PER_PAGE', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate limit
    |--------------------------------------------------------------------------
    | Jumlah request per menit per user (atau per IP jika belum login).
    */
    'rate_limit' => (int) env('API_RATE_LIMIT', 60),

];

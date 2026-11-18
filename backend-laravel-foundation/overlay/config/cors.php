<?php

/*
|--------------------------------------------------------------------------
| CORS — LMS Simba
|--------------------------------------------------------------------------
|
| Hanya origin yang terdaftar di CORS_ALLOWED_ORIGINS (dipisah koma) yang
| diizinkan. Default mengarah ke dev server frontend lokal (Vite :5173 dan
| :3000). Jangan gunakan "*" bersama supports_credentials.
| Autentikasi SPA berbasis cookie (Sanctum) membutuhkan CORS_SUPPORTS_CREDENTIALS=true.
|
*/

$allowedOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000'))
)));

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With', 'X-Request-Id', 'X-XSRF-TOKEN'],

    'exposed_headers' => ['X-Request-Id', 'Retry-After'],

    'max_age' => (int) env('CORS_MAX_AGE', 600),

    'supports_credentials' => filter_var(env('CORS_SUPPORTS_CREDENTIALS', false), FILTER_VALIDATE_BOOLEAN),

];

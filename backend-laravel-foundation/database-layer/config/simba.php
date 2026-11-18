<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Password akun demo (seeder)
    |--------------------------------------------------------------------------
    | Dibaca dari SEED_DEFAULT_PASSWORD di .env. Jika kosong, seeder membuat
    | password acak dan menampilkannya sekali di konsol. Jangan di-hardcode.
    */
    'seed_password' => env('SEED_DEFAULT_PASSWORD'),

    /*
    |--------------------------------------------------------------------------
    | Frontend SPA
    |--------------------------------------------------------------------------
    | Dipakai untuk tautan reset password yang dikirim lewat email.
    */
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    /*
    |--------------------------------------------------------------------------
    | Pembatasan percobaan login (per kombinasi login + IP, hanya kegagalan dihitung)
    |--------------------------------------------------------------------------
    */
    'login' => [
        'max_attempts' => (int) env('LOGIN_MAX_ATTEMPTS', 5),
        'decay_seconds' => (int) env('LOGIN_DECAY_SECONDS', 300),
    ],

    /*
    |--------------------------------------------------------------------------
    | Reset password
    |--------------------------------------------------------------------------
    | Masa berlaku token (menit). Diterapkan ke auth.passwords.users.expire.
    */
    'password_reset' => [
        'expire_minutes' => (int) env('PASSWORD_RESET_EXPIRE_MINUTES', 60),
    ],

];

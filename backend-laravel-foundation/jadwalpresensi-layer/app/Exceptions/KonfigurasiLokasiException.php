<?php

namespace App\Exceptions;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Titik referensi presensi belum dikonfigurasi di server (503). Siswa tidak dapat memperbaikinya. */
class KonfigurasiLokasiException extends HttpException
{
    public function __construct(string $message = 'Titik lokasi presensi belum dikonfigurasi. Hubungi admin sekolah.')
    {
        parent::__construct(503, $message);
    }

    public function render(): JsonResponse
    {
        return ApiResponse::error($this->getMessage(), 503, 'location_not_configured');
    }
}

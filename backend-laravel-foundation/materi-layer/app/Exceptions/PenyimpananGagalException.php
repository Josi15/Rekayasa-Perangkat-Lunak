<?php

namespace App\Exceptions;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

/** Kegagalan menulis ke penyimpanan file. Detail teknis hanya di log, tidak pernah di respons. */
class PenyimpananGagalException extends HttpException
{
    public function __construct(string $message = 'File tidak dapat disimpan saat ini. Silakan coba lagi.', ?Throwable $sebelumnya = null)
    {
        parent::__construct(503, $message, $sebelumnya);
    }

    public function render(): JsonResponse
    {
        return ApiResponse::error($this->getMessage(), 503, 'storage_failure');
    }
}

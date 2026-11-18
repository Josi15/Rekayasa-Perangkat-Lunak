<?php

namespace App\Exceptions;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Aturan bisnis menolak operasi pada keadaan data saat ini (HTTP 409), mis. mengarsipkan kelas
 * yang masih punya jadwal mendatang. Berbeda dari 422 (input salah) dan 403 (tidak berwenang).
 * Memiliki render() sendiri sehingga kode yang spesifik (mis. "class_archived") sampai ke klien.
 */
class KonflikBisnisException extends HttpException
{
    public function __construct(string $message, public readonly string $kode)
    {
        parent::__construct(409, $message);
    }

    public function render(): JsonResponse
    {
        return ApiResponse::error($this->getMessage(), 409, $this->kode);
    }
}

<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Context;

/**
 * Format respons JSON standar LMS Simba.
 *
 * Sukses : { "data": ..., "meta": {...}? }
 *          (resource/collection Laravel memakai bentuk native: data, links, meta)
 * Error  : { "message": "...", "code": "...", "errors": {...}?, "request_id": "..." }
 */
final class ApiResponse
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public static function data(mixed $data = null, int $status = 200, array $meta = []): JsonResponse
    {
        $payload = ['data' => $data];

        if ($meta !== []) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    /**
     * @param  array<string, mixed>|null  $errors
     * @param  array<string, string>  $headers
     * @param  array<string, mixed>  $extra
     */
    public static function error(
        string $message,
        int $status,
        string $code,
        ?array $errors = null,
        array $headers = [],
        array $extra = [],
    ): JsonResponse {
        $payload = ['message' => $message, 'code' => $code];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        $requestId = Context::get('request_id');

        if ($requestId !== null) {
            $payload['request_id'] = $requestId;
        }

        return response()->json($payload + $extra, $status, $headers);
    }
}

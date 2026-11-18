<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Controller dasar untuk seluruh endpoint API. Controller fitur meng-extend kelas ini.
 */
abstract class ApiController extends Controller
{
    /**
     * @param  array<string, mixed>  $meta
     */
    protected function respond(mixed $data = null, int $status = 200, array $meta = []): JsonResponse
    {
        return ApiResponse::data($data, $status, $meta);
    }

    protected function created(mixed $data = null): JsonResponse
    {
        return ApiResponse::data($data, 201);
    }

    protected function noContent(): Response
    {
        return response()->noContent();
    }
}

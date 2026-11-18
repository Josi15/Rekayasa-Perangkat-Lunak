<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends ApiController
{
    /**
     * GET /api/v1/health — liveness: aplikasi hidup (tanpa menyentuh database).
     */
    public function live(): JsonResponse
    {
        return $this->respond([
            'status' => 'ok',
            'app' => config('app.name'),
            'api_version' => config('api.version'),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/v1/health/ready — readiness: aplikasi siap melayani (database terjangkau).
     */
    public function ready(): JsonResponse
    {
        try {
            DB::select('select 1');
            $database = 'ok';
        } catch (Throwable $e) {
            report($e);
            $database = 'error';
        }

        $healthy = $database === 'ok';

        return $this->respond([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => ['database' => $database],
            'timestamp' => now()->toIso8601String(),
        ], $healthy ? 200 : 503);
    }
}

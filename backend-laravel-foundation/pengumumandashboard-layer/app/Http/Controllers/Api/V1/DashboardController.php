<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Dashboard\DashboardRequest;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends ApiController
{
    public function __construct(private readonly DashboardService $layanan) {}

    /** GET /dashboard — statistik sesuai peran pemanggil (peran dibaca dari database, bukan dari input klien). */
    public function show(DashboardRequest $request): JsonResponse
    {
        return $this->respond($this->layanan->untuk($request->user(), $request));
    }
}

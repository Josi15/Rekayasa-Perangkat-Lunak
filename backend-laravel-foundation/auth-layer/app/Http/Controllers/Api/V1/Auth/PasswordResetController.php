<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Auth\ForgotPasswordRequest;
use App\Http\Requests\Api\Auth\ResetPasswordRequest;
use App\Http\Requests\Api\Auth\ValidateResetTokenRequest;
use App\Models\Pengguna;
use App\Support\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Contracts\Auth\PasswordBroker as PasswordBrokerContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Throwable;

/**
 * Reset password lewat email. Prinsip: respons TIDAK membedakan akun terdaftar / tidak,
 * dan token tidak pernah muncul di respons (hanya di tautan email).
 */
class PasswordResetController extends ApiController
{
    private const PESAN_UMUM = 'Jika alamat email terdaftar, tautan untuk mengatur ulang password telah dikirim.';

    private const PESAN_TOKEN = 'Token reset tidak valid atau sudah kedaluwarsa.';

    /**
     * POST /api/v1/auth/forgot-password
     */
    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        try {
            // Status (terkirim / akun tidak ada / terlalu sering) sengaja diabaikan.
            Password::sendResetLink($request->only('email'));
        } catch (Throwable $e) {
            report($e); // kegagalan internal tidak boleh membedakan respons
        }

        return $this->respond(['message' => self::PESAN_UMUM]);
    }

    /**
     * POST /api/v1/auth/reset-password/validate
     */
    public function validateToken(ValidateResetTokenRequest $request): JsonResponse
    {
        $broker = Password::broker();
        $pengguna = $broker->getUser($request->only('email'));

        $valid = $pengguna !== null
            && $broker->tokenExists($pengguna, $request->string('token')->toString());

        return $valid ? $this->respond(['valid' => true]) : $this->tokenTidakValid();
    }

    /**
     * POST /api/v1/auth/reset-password
     */
    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (Pengguna $pengguna, string $password): void {
                $pengguna->forceFill([
                    'password' => $password, // di-hash oleh cast "hashed"
                    'remember_token' => Str::random(60),
                ])->save();

                $this->cabutSemuaSesi($pengguna);

                event(new PasswordReset($pengguna));
            }
        );

        // Token salah, kedaluwarsa, atau email tak dikenal -> respons yang sama.
        if ($status !== PasswordBrokerContract::PASSWORD_RESET) {
            return $this->tokenTidakValid();
        }

        return $this->respond(['message' => 'Password berhasil diubah. Silakan login dengan password baru.']);
    }

    private function tokenTidakValid(): JsonResponse
    {
        return ApiResponse::error(self::PESAN_TOKEN, 422, 'invalid_reset_token', ['token' => [self::PESAN_TOKEN]]);
    }

    /** Setelah password diganti, seluruh sesi lama pengguna dicabut (jika sesi disimpan di database). */
    private function cabutSemuaSesi(Pengguna $pengguna): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        DB::connection(config('session.connection'))
            ->table((string) config('session.table', 'sessions'))
            ->where('user_id', $pengguna->getAuthIdentifier())
            ->delete();
    }
}

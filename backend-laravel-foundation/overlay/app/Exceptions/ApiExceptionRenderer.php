<?php

namespace App\Exceptions;

use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

/**
 * Mengubah seluruh exception pada request API menjadi respons JSON yang konsisten.
 * Didaftarkan dari bootstrap/app.php: ApiExceptionRenderer::register($exceptions).
 */
final class ApiExceptionRenderer
{
    public static function register(Exceptions $exceptions): void
    {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, Throwable $e): bool => self::wantsJson($request)
        );

        $exceptions->render(function (Throwable $e, Request $request): ?JsonResponse {
            return self::wantsJson($request) ? self::toResponse($e) : null;
        });
    }

    public static function toResponse(Throwable $e): JsonResponse
    {
        return match (true) {
            $e instanceof ValidationException => ApiResponse::error(
                'The given data was invalid.', 422, 'validation_error', $e->errors()
            ),
            $e instanceof AuthenticationException => ApiResponse::error(
                'Unauthenticated.', 401, 'unauthenticated'
            ),
            $e instanceof AuthorizationException, $e instanceof AccessDeniedHttpException => ApiResponse::error(
                'This action is unauthorized.', 403, 'forbidden'
            ),
            $e instanceof ModelNotFoundException, $e instanceof NotFoundHttpException => ApiResponse::error(
                'Resource not found.', 404, 'not_found'
            ),
            $e instanceof MethodNotAllowedHttpException => ApiResponse::error(
                'Method not allowed.', 405, 'method_not_allowed', null, $e->getHeaders()
            ),
            $e instanceof TooManyRequestsHttpException => ApiResponse::error(
                'Too many requests.', 429, 'too_many_requests', null, $e->getHeaders()
            ),
            $e instanceof HttpExceptionInterface => self::fromHttpException($e),
            default => self::serverError($e),
        };
    }

    private static function wantsJson(Request $request): bool
    {
        return $request->is('api/*') || $request->expectsJson();
    }

    private static function fromHttpException(HttpExceptionInterface $e): JsonResponse
    {
        $status = $e->getStatusCode();
        $message = $e->getMessage() !== '' ? $e->getMessage() : (Response::$statusTexts[$status] ?? 'Error');

        return ApiResponse::error($message, $status, 'http_error', null, $e->getHeaders());
    }

    private static function serverError(Throwable $e): JsonResponse
    {
        // Detail internal tidak pernah dikirim ke klien kecuali APP_DEBUG=true.
        $extra = config('app.debug') ? ['debug' => [
            'exception' => $e::class,
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]] : [];

        return ApiResponse::error('Server error.', 500, 'server_error', null, [], $extra);
    }
}

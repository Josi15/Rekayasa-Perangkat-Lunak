<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        // Hanya validasi format; keberadaan akun TIDAK diperiksa (tanpa "exists:").
        return ['email' => ['required', 'string', 'email', 'max:255']];
    }
}

<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Sengaja tanpa aturan kekuatan password: login hanya memeriksa kecocokan.
     * Field lain (mis. "peran") tidak pernah dibaca.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string', 'max:255'],
        ];
    }

    public function login(): string
    {
        return trim($this->string('login')->toString());
    }

    public function kataSandi(): string
    {
        return $this->string('password')->toString();
    }
}

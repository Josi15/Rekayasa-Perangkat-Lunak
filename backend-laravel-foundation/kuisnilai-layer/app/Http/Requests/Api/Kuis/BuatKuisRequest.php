<?php

namespace App\Http\Requests\Api\Kuis;

use App\Models\Kuis;
use App\Rules\TautanGoogleForm;
use Illuminate\Foundation\Http\FormRequest;

/** POST /mapel/{mapel}/kuis — hanya guru pengampu mapel itu. */
class BuatKuisRequest extends FormRequest
{
    public function authorize(): bool
    {
        $mapel = $this->route('mapel');

        return $mapel !== null && ($this->user()?->can('create', [Kuis::class, $mapel]) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'tautan_google_form' => ['required', 'string', 'max:2048', new TautanGoogleForm],
        ];
    }
}

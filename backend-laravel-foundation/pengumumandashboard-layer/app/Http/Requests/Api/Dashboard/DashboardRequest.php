<?php

namespace App\Http\Requests\Api\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

/** GET /dashboard — isi ditentukan peran pemanggil di server. dari/sampai hanya memengaruhi ringkasan presensi admin. */
class DashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'dari' => ['sometimes', 'date_format:Y-m-d'],
            'sampai' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:dari'],
        ];
    }
}

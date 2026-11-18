<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

/**
 * Dasar endpoint daftar: pagination + pencarian (cari) + status + pengurutan.
 * Kolom urut berasal dari whitelist subclass sehingga input klien tidak pernah menjadi nama kolom mentah.
 */
abstract class DaftarRequest extends PaginationRequest
{
    /** Kolom yang boleh dipakai pengurutan; elemen pertama = urutan bawaan. @return list<string> */
    abstract protected function kolomUrut(): array;

    /** @return list<string> */
    protected function statusValid(): array
    {
        return ['aktif', 'diarsipkan', 'semua'];
    }

    protected function statusBawaan(): string
    {
        return 'aktif';
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return parent::rules() + [
            // regex /u menolak byte NUL & UTF-8 tidak valid (PostgreSQL menolaknya sebagai error 500).
            'cari' => ['sometimes', 'nullable', 'string', 'max:100', 'regex:/^[^\x00]*$/u'],
            'status' => ['sometimes', 'string', Rule::in($this->statusValid())],
            'urut' => ['sometimes', 'string', Rule::in($this->kolomUrut())],
            'arah' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
        ];
    }

    public function cari(): ?string
    {
        $nilai = $this->input('cari');

        return is_string($nilai) && trim($nilai) !== '' ? trim($nilai) : null;
    }

    public function status(): string
    {
        return $this->string('status', $this->statusBawaan())->toString();
    }

    public function urut(): string
    {
        return $this->string('urut', $this->kolomUrut()[0])->toString();
    }

    public function arah(): string
    {
        return $this->string('arah', 'asc')->toString();
    }
}

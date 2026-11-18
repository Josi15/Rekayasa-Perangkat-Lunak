<?php

namespace App\Http\Requests\Api\Presensi;

use App\Http\Requests\Api\PaginationRequest;
use App\Support\PeriodeTanggal;
use Illuminate\Contracts\Validation\Validator;

/**
 * GET /rekap/presensi?dari=&sampai=&id_kelas=&id_mapel=&id_guru=&id_siswa=&id_jadwal=
 * Periode wajib (maks config presensi.rekap.maks_hari). Isi dibatasi per peran di RekapPresensiService.
 */
class RekapPresensiRequest extends PaginationRequest
{
    public function rules(): array
    {
        return parent::rules() + [
            'dari' => ['required', 'date_format:Y-m-d'],
            'sampai' => ['required', 'date_format:Y-m-d', 'after_or_equal:dari'],
            'id_kelas' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_mapel' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_guru' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_siswa' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_jadwal' => ['sometimes', 'bail', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($v->errors()->hasAny(['dari', 'sampai'])) {
                return;
            }

            [$awal, $akhir] = PeriodeTanggal::batas($this->input('dari'), $this->input('sampai'));
            $maks = (int) config('presensi.rekap.maks_hari', 366);

            if ($awal->diffInDays($akhir) > $maks) {
                $v->errors()->add('sampai', "Periode maksimal {$maks} hari.");
            }
        });
    }

    /** @return array<string, mixed> filter untuk RekapPresensiService */
    public function filter(): array
    {
        [$awal, $akhir] = PeriodeTanggal::batas($this->input('dari'), $this->input('sampai'));
        $f = ['dari' => $awal, 'sampai' => $akhir];

        foreach (['id_kelas', 'id_mapel', 'id_guru', 'id_siswa', 'id_jadwal'] as $k) {
            if ($this->filled($k)) {
                $f[$k] = $this->integer($k);
            }
        }

        return $f;
    }
}

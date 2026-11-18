<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Tahap 3: Laravel menyajikan frontend React + berkas privat tidak bisa diakses langsung lewat web.
 * Memakai index.html sementara (config spa.index_path), jadi tidak bergantung pada hasil build asli.
 */
class SpaServingTest extends TestCase
{
    private string $indexSementara;

    protected function setUp(): void
    {
        parent::setUp();
        $this->indexSementara = sys_get_temp_dir().'/simba-spa-'.uniqid().'.html';
        file_put_contents($this->indexSementara, '<!doctype html><html><body><div id="root">SPA-OK</div></body></html>');
        config(['spa.index_path' => $this->indexSementara]);
    }

    protected function tearDown(): void
    {
        @unlink($this->indexSementara);
        parent::tearDown();
    }

    /** @return array<string, array{string}> */
    public static function rute_react(): array
    {
        return [['/'], ['/login'], ['/forgot-password'], ['/admin/users'], ['/teacher/classes/12'], ['/student/materials'], ['/403'], ['/rute-acak/yang/tak-ada']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('rute_react')]
    public function test_path_non_api_mengembalikan_index_html(string $path): void
    {
        $this->get($path)
            ->assertOk()
            ->assertSee('SPA-OK', false)
            ->assertHeader('Cache-Control')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_index_html_tidak_membuat_cookie_sesi(): void
    {
        $r = $this->get('/admin/users')->assertOk();
        $this->assertSame([], $r->headers->getCookies(), 'halaman SPA tidak boleh men-set cookie');
    }

    public function test_index_html_tidak_di_cache_agar_rilis_baru_terpakai(): void
    {
        $cc = (string) $this->get('/login')->headers->get('Cache-Control');
        $this->assertStringContainsString('no-cache', $cc);
    }

    public function test_index_hilang_memberi_503_bukan_500(): void
    {
        config(['spa.index_path' => $this->indexSementara.'.tidak-ada']);
        $this->get('/login')->assertStatus(503)->assertDontSee('<html', false);
    }

    public function test_api_tak_dikenal_tetap_json_404_bukan_html(): void
    {
        $this->get('/api/v1/tidak-ada')
            ->assertNotFound()
            ->assertJsonPath('code', 'not_found')
            ->assertDontSee('SPA-OK', false);
        $this->get('/api')->assertNotFound()->assertDontSee('SPA-OK', false);
    }

    public function test_api_tetap_berfungsi(): void
    {
        $this->getJson('/api/v1/health')->assertOk()->assertJsonPath('data.status', 'ok');
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('path_bukan_spa')]
    public function test_path_bukan_spa_tidak_mengembalikan_html(string $path): void
    {
        $this->get($path)->assertDontSee('SPA-OK', false);
    }

    /** @return array<string, array{string}> */
    public static function path_bukan_spa(): array
    {
        return [['/assets/hilang-abc123.js'], ['/foo.js'], ['/dokumen/x.pdf'], ['/.env'], ['/.git/config'], ['/storage/apa-saja'], ['/sanctum/tidak-ada']];
    }

    public function test_berkas_privat_tidak_bisa_diakses_lewat_url_web(): void
    {
        $rahasia = 'ISI-RAHASIA-'.uniqid();
        $disk = Storage::disk((string) config('materi.disk'));
        $rel = 'materi/uji-spa-'.uniqid().'.pdf';
        $disk->put($rel, $rahasia);

        try {
            foreach ([
                '/'.$rel,
                '/storage/'.$rel,
                '/storage/app/private/'.$rel,
                '/private/'.$rel,
                '/public/'.$rel,
                '/../storage/app/private/'.$rel,
            ] as $url) {
                $r = $this->get($url);
                $this->assertNotSame(200, $r->getStatusCode(), "URL $url tidak boleh 200");
                $this->assertStringNotContainsString($rahasia, (string) $r->getContent(), "URL $url membocorkan isi berkas");
            }
        } finally {
            $disk->delete($rel);
        }
    }

    public function test_disk_materi_dan_tugas_berada_di_luar_public(): void
    {
        foreach (['materi', 'tugas'] as $k) {
            $disk = (string) config($k.'.disk');
            $this->assertNotSame('public', $disk, "$k.disk tidak boleh 'public'");
            $root = (string) config('filesystems.disks.'.$disk.'.root');
            $this->assertNotSame('', $root);
            $this->assertStringStartsNotWith(realpath(public_path()) ?: public_path(), $root, "root disk $k berada di dalam public/");
        }
    }
}

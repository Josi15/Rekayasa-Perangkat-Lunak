<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class FoundationTest extends TestCase
{
    public function test_liveness_endpoint_returns_json_ok(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.api_version', 'v1')
            ->assertHeader('X-Request-Id');
    }

    public function test_readiness_endpoint_checks_database(): void
    {
        $this->getJson('/api/v1/health/ready')
            ->assertOk()
            ->assertJsonPath('data.checks.database', 'ok');
    }

    public function test_unknown_api_route_returns_json_404(): void
    {
        $this->get('/api/v1/tidak-ada')
            ->assertNotFound()
            ->assertJsonPath('code', 'not_found')
            ->assertJsonStructure(['message', 'code', 'request_id']);
    }

    public function test_wrong_method_returns_json_405(): void
    {
        $this->post('/api/v1/health')
            ->assertStatus(405)
            ->assertJsonPath('code', 'method_not_allowed');
    }

    public function test_client_request_id_is_echoed_when_valid(): void
    {
        $this->withHeader('X-Request-Id', 'abc-12345678')
            ->getJson('/api/v1/health')
            ->assertHeader('X-Request-Id', 'abc-12345678');
    }

    public function test_cors_allows_configured_frontend_origin(): void
    {
        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'GET',
        ])->options('/api/v1/health')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function test_cors_does_not_allow_unknown_origin(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://evil.example',
            'Access-Control-Request-Method' => 'GET',
        ])->options('/api/v1/health');

        $this->assertNotSame('http://evil.example', $response->headers->get('Access-Control-Allow-Origin'));
    }
}

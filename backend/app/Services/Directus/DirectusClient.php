<?php

namespace App\Services\Directus;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Thin REST client for the Directus API.
 *
 * Directus is used as the CMS / admin front-end. Laravel talks to it with an
 * admin account so it can provision CMS users and keep CMS metadata in sync.
 */
class DirectusClient
{
    protected ?string $token = null;

    protected ?int $tokenExpiresAt = null;

    /** @var array<string, string> */
    protected array $roleCache = [];

    public function enabled(): bool
    {
        return (bool) config('petbook.directus.enabled')
            && config('petbook.directus.url')
            && config('petbook.directus.admin_email')
            && config('petbook.directus.admin_password');
    }

    public function get(string $path, array $query = []): array
    {
        return $this->request('GET', $path, $query);
    }

    public function post(string $path, array $data = []): array
    {
        return $this->request('POST', $path, $data);
    }

    public function patch(string $path, array $data = []): array
    {
        return $this->request('PATCH', $path, $data);
    }

    public function delete(string $path): array
    {
        return $this->request('DELETE', $path);
    }

    public function login(): string
    {
        if ($this->token !== null && $this->tokenExpiresAt !== null && $this->tokenExpiresAt > time() + 15) {
            return $this->token;
        }

        $response = Http::acceptJson()->post($this->url('/auth/login'), [
            'email' => config('petbook.directus.admin_email'),
            'password' => config('petbook.directus.admin_password'),
            'mode' => 'json',
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Unable to authenticate with Directus: '.$response->body());
        }

        $data = $response->json('data');

        $this->token = $data['access_token'] ?? null;
        $this->tokenExpiresAt = isset($data['expires']) ? (int) $data['expires'] : time() + 900;

        if ($this->token === null) {
            throw new RuntimeException('Directus login did not return an access token.');
        }

        return $this->token;
    }

    public function roleId(string $roleName): ?string
    {
        if (isset($this->roleCache[$roleName])) {
            return $this->roleCache[$roleName];
        }

        $response = $this->get('/roles', [
            'filter' => json_encode(['name' => ['_eq' => $roleName]]),
            'fields' => 'id,name',
            'limit' => 1,
        ]);

        $role = $response['data'][0] ?? null;

        if ($role === null) {
            return null;
        }

        return $this->roleCache[$roleName] = $role['id'];
    }

    /**
     * Find a Directus user by e-mail or create one.
     */
    public function findOrCreateUser(array $attributes, ?string $roleName = null, array $extra = []): ?string
    {
        $email = $attributes['email'] ?? null;

        if (! $email) {
            return null;
        }

        $existing = $this->get('/users', [
            'filter' => json_encode(['email' => ['_eq' => $email]]),
            'fields' => 'id,email',
            'limit' => 1,
        ]);

        if (! empty($existing['data'][0]['id'])) {
            $id = $existing['data'][0]['id'];

            if ($extra !== []) {
                $this->patch('/users/'.$id, $extra);
            }

            return $id;
        }

        $payload = array_filter($attributes, static fn ($value) => $value !== null);

        if ($roleName !== null && ($roleId = $this->roleId($roleName)) !== null) {
            $payload['role'] = $roleId;
        }

        $payload = array_merge($payload, $extra);

        $response = $this->post('/users', $payload);

        return $response['data']['id'] ?? null;
    }

    protected function request(string $method, string $path, array $payload = []): array
    {
        $response = $this->send($method, $path, $payload);

        if ($response->status() === 401) {
            $this->token = null;
            $this->tokenExpiresAt = null;
            $response = $this->send($method, $path, $payload);
        }

        if ($response->failed()) {
            Log::warning('Directus request failed', [
                'method' => $method,
                'path' => $path,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException('Directus request failed: '.$response->status());
        }

        if ($response->status() === 204) {
            return [];
        }

        return $response->json() ?? [];
    }

    protected function send(string $method, string $path, array $payload = []): Response
    {
        $request = Http::acceptJson()->withToken($this->login());

        return match (strtoupper($method)) {
            'GET' => $request->get($this->url($path), $payload),
            'POST' => $request->post($this->url($path), $payload),
            'PATCH' => $request->patch($this->url($path), $payload),
            'DELETE' => $request->delete($this->url($path)),
            default => throw new RuntimeException("Unsupported HTTP method [{$method}]"),
        };
    }

    protected function url(string $path): string
    {
        return rtrim((string) config('petbook.directus.url'), '/').'/'.ltrim($path, '/');
    }
}

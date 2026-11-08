<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $database = 'ok';

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $database = 'error: '.$e->getMessage();
        }

        return response()->json([
            'status' => $database === 'ok' ? 'ok' : 'degraded',
            'app' => config('app.name'),
            'database' => $database,
            'directus' => [
                'enabled' => (bool) config('petbook.directus.enabled'),
                'url' => config('petbook.directus.url'),
            ],
            'time' => now()->toIso8601String(),
        ], $database === 'ok' ? 200 : 503);
    }
}

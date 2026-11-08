<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyCronSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('petbook.cron_secret');

        if ($secret === '' || ! hash_equals($secret, (string) $request->header('X-Cron-Secret'))) {
            return response()->json(['message' => 'Invalid cron secret.'], 403);
        }

        return $next($request);
    }
}

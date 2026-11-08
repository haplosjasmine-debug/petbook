<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function __construct(protected LoyaltyService $loyalty)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $transactions = $user->loyaltyTransactions()
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => [
                'balance' => (int) $user->loyalty_points,
                'transactions' => $transactions,
            ],
        ]);
    }

    public function redeem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'points' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $transaction = $this->loyalty->redeem(
            $request->user(),
            (int) $data['points'],
            $data['description'] ?? 'Loyalty points redeemed'
        );

        return response()->json([
            'message' => 'Points redeemed.',
            'data' => $transaction,
            'balance' => (int) $request->user()->fresh()->loyalty_points,
        ]);
    }
}

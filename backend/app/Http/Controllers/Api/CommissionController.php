<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function __construct(protected CommissionService $commission)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Transaction::query()
            ->with(['business:id,name', 'appointment:id,start_at,pet_id', 'packagePurchase:id,service_package_id', 'owner:id,first_name,last_name']);

        if ($user->isBusiness()) {
            $business = $this->businessFor($user);
            abort_if($business === null, 403, 'No business is linked to this account.');
            $query->where('business_id', $business->id);
        } elseif (! $user->isAdmin()) {
            abort(403);
        }

        $transactions = $query
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->integer('per_page', 50), 100));

        return response()->json($transactions);
    }

    public function markPaid(Request $request, Transaction $transaction): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Only platform admins can settle commissions.');

        $transaction = $this->commission->markPaid($transaction);

        return response()->json(['message' => 'Commission marked as paid.', 'data' => $transaction]);
    }
}

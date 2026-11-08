<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\PackagePurchase;
use App\Models\Transaction;
use App\Services\CommissionService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $payments,
        protected CommissionService $commission
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Transaction::query()->with([
            'business:id,name',
            'appointment:id,start_at,pet_id,service_id',
            'packagePurchase:id,service_package_id',
        ]);

        if ($user->isOwner()) {
            $query->where('owner_id', $user->id);
        } elseif ($user->isBusiness()) {
            $business = $this->businessFor($user);
            abort_if($business === null, 403, 'No business is linked to this account.');
            $query->where('business_id', $business->id);
        } elseif (! $user->isAdmin()) {
            abort(403);
        }

        $transactions = $query
            ->when($request->filled('payment_status'), fn ($q) => $q->where('payment_status', $request->string('payment_status')))
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->integer('per_page', 50), 100));

        return response()->json($transactions);
    }

    public function show(Request $request, Transaction $transaction): JsonResponse
    {
        $this->ensureTransactionAccess($request->user(), $transaction);

        $transaction->load([
            'business:id,name',
            'appointment.pet:id,name',
            'appointment.service:id,name,price',
            'packagePurchase.servicePackage:id,name,price',
        ]);

        return response()->json(['data' => $transaction]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'appointment_id' => ['required_without_all:package_purchase_id,transaction_id', 'integer', 'exists:appointments,id'],
            'package_purchase_id' => ['required_without_all:appointment_id,transaction_id', 'integer', 'exists:package_purchases,id'],
            'transaction_id' => ['required_without_all:appointment_id,package_purchase_id', 'integer', 'exists:transactions,id'],
            'payment_methods' => ['nullable', 'array'],
            'payment_methods.*' => [Rule::in(config('payments.paymongo.payment_methods', []))],
            'success_url' => ['nullable', 'url', 'max:500'],
            'cancel_url' => ['nullable', 'url', 'max:500'],
        ]);

        $user = $request->user();

        if (! empty($data['appointment_id'])) {
            $appointment = Appointment::with('service')->findOrFail($data['appointment_id']);

            abort_unless($user->isAdmin() || $appointment->owner_id === $user->id, 403, 'You can only pay for your own appointments.');
            abort_if($appointment->status->value === 'cancelled', 422, 'Cancelled appointments cannot be paid.');

            $transaction = $this->commission->recordForAppointment($appointment);
        } elseif (! empty($data['package_purchase_id'])) {
            $purchase = PackagePurchase::with('servicePackage')->findOrFail($data['package_purchase_id']);

            abort_unless($user->isAdmin() || $purchase->owner_id === $user->id, 403, 'You can only pay for your own packages.');

            $transaction = $this->commission->recordForPackagePurchase($purchase);
        } else {
            $transaction = Transaction::findOrFail($data['transaction_id']);
            $this->ensureTransactionAccess($user, $transaction);
        }

        $transaction = $this->payments->checkout($transaction, [
            'payment_methods' => $data['payment_methods'] ?? null,
            'success_url' => $data['success_url'] ?? null,
            'cancel_url' => $data['cancel_url'] ?? null,
        ]);

        return response()->json([
            'message' => 'Checkout session created. Open the checkout URL to pay with GCash, Maya, GrabPay, QR Ph or card.',
            'data' => [
                'transaction' => $transaction,
                'checkout_url' => $transaction->checkout_url,
                'checkout_session_id' => $transaction->checkout_session_id,
            ],
        ], 201);
    }

    public function markCashPaid(Request $request, Transaction $transaction): JsonResponse
    {
        $user = $request->user();

        if (! $user->isAdmin()) {
            abort_unless($user->isBusiness(), 403);
            $business = $this->businessFor($user);
            abort_if($business === null || $business->id !== $transaction->business_id, 403, 'You do not have access to this transaction.');
        }

        if ($transaction->payment_status === PaymentStatus::Paid) {
            return response()->json(['message' => 'This transaction is already paid.', 'data' => $transaction]);
        }

        $data = $request->validate([
            'reference' => ['nullable', 'string', 'max:100'],
        ]);

        $transaction = $this->payments->markCashPaid($transaction, $data['reference'] ?? null);

        return response()->json([
            'message' => 'Cash payment recorded.',
            'data' => $transaction,
        ]);
    }

    protected function ensureTransactionAccess($user, Transaction $transaction): void
    {
        if ($user->isAdmin() || $transaction->owner_id === $user->id) {
            return;
        }

        if ($user->isBusiness()) {
            $business = $this->businessFor($user);

            if ($business !== null && $business->id === $transaction->business_id) {
                return;
            }
        }

        abort(403, 'You do not have access to this transaction.');
    }
}

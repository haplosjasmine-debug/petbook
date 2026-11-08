<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Transaction;
use App\Services\Payments\PaymentGateway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(protected PaymentGateway $gateway)
    {
    }

    public function gateway(): PaymentGateway
    {
        return $this->gateway;
    }

    public function checkout(Transaction $transaction, array $options = []): Transaction
    {
        $transaction->refresh();

        if ($transaction->payment_status === PaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'payment' => 'This transaction has already been paid.',
            ]);
        }

        if ((float) $transaction->amount <= 0) {
            throw ValidationException::withMessages([
                'payment' => 'No payment is due for this transaction.',
            ]);
        }

        $checkout = $this->gateway->createCheckout($transaction, $options);

        $transaction->update([
            'payment_provider' => $this->gateway->provider(),
            'payment_method' => $options['payment_method'] ?? null,
            'payment_status' => PaymentStatus::Pending,
            'payment_reference' => $checkout['reference'],
            'checkout_session_id' => $checkout['checkout_session_id'],
            'checkout_url' => $checkout['checkout_url'],
        ]);

        return $transaction->fresh();
    }

    public function verifyWebhook(Request $request): bool
    {
        return $this->gateway->verifyWebhook($request);
    }

    public function parseWebhook(array $payload): ?array
    {
        return $this->gateway->parseWebhook($payload);
    }

    /**
     * Apply a normalised provider event to the matching transaction.
     */
    public function applyWebhookEvent(?array $event): ?Transaction
    {
        if ($event === null) {
            return null;
        }

        $transaction = $this->findTransaction($event);

        if ($transaction === null) {
            Log::warning('Payment webhook could not match a transaction', $event);

            return null;
        }

        $status = PaymentStatus::tryFrom((string) $event['status']) ?? PaymentStatus::Pending;

        if ($transaction->payment_status === PaymentStatus::Paid && $status !== PaymentStatus::Paid) {
            return $transaction;
        }

        $transaction->update([
            'payment_status' => $status,
            'payment_method' => $event['method'] ?? $transaction->payment_method,
            'payment_reference' => $event['payment_id'] ?? $transaction->payment_reference,
            'payment_paid_at' => $status === PaymentStatus::Paid ? now() : $transaction->payment_paid_at,
            'payment_payload' => $event,
        ]);

        return $transaction->fresh();
    }

    /**
     * Record an offline (cash) payment taken at the counter.
     */
    public function markCashPaid(Transaction $transaction, ?string $reference = null): Transaction
    {
        $transaction->update([
            'payment_provider' => 'cash',
            'payment_method' => 'cash',
            'payment_status' => PaymentStatus::Paid,
            'payment_reference' => $reference ?? 'CASH-'.$transaction->id,
            'payment_paid_at' => now(),
        ]);

        return $transaction->fresh();
    }

    public function refund(Transaction $transaction): Transaction
    {
        $transaction->update([
            'payment_status' => PaymentStatus::Refunded,
        ]);

        return $transaction->fresh();
    }

    protected function findTransaction(array $event): ?Transaction
    {
        if (! empty($event['transaction_id'])) {
            $transaction = Transaction::find((int) $event['transaction_id']);

            if ($transaction !== null) {
                return $transaction;
            }
        }

        if (! empty($event['checkout_session_id'])) {
            return Transaction::where('checkout_session_id', $event['checkout_session_id'])->first();
        }

        return null;
    }
}

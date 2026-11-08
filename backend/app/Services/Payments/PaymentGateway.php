<?php

namespace App\Services\Payments;

use App\Models\Transaction;
use Illuminate\Http\Request;

interface PaymentGateway
{
    public function provider(): string;

    /**
     * Create a hosted checkout session and return provider identifiers.
     *
     * @return array{checkout_session_id: string, checkout_url: string, reference: string}
     */
    public function createCheckout(Transaction $transaction, array $options = []): array;

    public function verifyWebhook(Request $request): bool;

    /**
     * Normalise a provider webhook payload into a PetBook payment event.
     *
     * @return array{event: string, status: string, transaction_id: ?int, checkout_session_id: ?string, payment_id: ?string, method: ?string, amount: ?float}|null
     */
    public function parseWebhook(array $payload): ?array;
}

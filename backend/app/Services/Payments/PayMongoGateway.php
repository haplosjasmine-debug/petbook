<?php

namespace App\Services\Payments;

use App\Enums\PaymentStatus;
use App\Models\Transaction;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PayMongoGateway implements PaymentGateway
{
    public function provider(): string
    {
        return 'paymongo';
    }

    public function createCheckout(Transaction $transaction, array $options = []): array
    {
        $secretKey = (string) config('payments.paymongo.secret_key');

        if ($secretKey === '') {
            throw ValidationException::withMessages([
                'payment' => 'PayMongo is not configured. Set PAYMONGO_SECRET_KEY first.',
            ]);
        }

        $transaction->loadMissing(['appointment.service', 'packagePurchase.servicePackage']);

        $methods = $options['payment_methods']
            ?? config('payments.paymongo.payment_methods', []);

        $allowed = config('payments.paymongo.payment_methods', []);

        $methods = $allowed === []
            ? $methods
            : array_values(array_intersect($methods, $allowed));

        if ($methods === []) {
            throw ValidationException::withMessages([
                'payment_methods' => 'Choose at least one supported payment method.',
            ]);
        }

        $description = $this->descriptionFor($transaction);
        $amountCentavos = (int) round((float) $transaction->amount * 100);

        $attributes = [
            'line_items' => [[
                'currency' => (string) config('payments.currency', 'PHP'),
                'amount' => $amountCentavos,
                'name' => $description,
                'quantity' => 1,
                'description' => 'PetBook transaction #'.$transaction->id,
            ]],
            'payment_method_types' => array_values($methods),
            'success_url' => $this->appendTransaction(
                $options['success_url'] ?? (string) config('payments.success_url'),
                $transaction
            ),
            'cancel_url' => $this->appendTransaction(
                $options['cancel_url'] ?? (string) config('payments.cancel_url'),
                $transaction
            ),
            'description' => 'PetBook payment for '.$description,
            'reference_number' => 'PB-'.$transaction->id,
            'send_email_receipt' => false,
            'show_description' => true,
            'show_line_items' => true,
            'metadata' => [
                'transaction_id' => (string) $transaction->id,
                'business_id' => (string) $transaction->business_id,
                'owner_id' => (string) $transaction->owner_id,
            ],
        ];

        $response = $this->client($secretKey)
            ->post('/checkout_sessions', ['data' => ['attributes' => $attributes]]);

        if ($response->failed()) {
            Log::error('PayMongo checkout session failed', [
                'status' => $response->status(),
                'body' => $response->json(),
                'transaction_id' => $transaction->id,
            ]);

            throw ValidationException::withMessages([
                'payment' => 'Unable to start the PayMongo checkout. Please try again.',
            ]);
        }

        $data = (array) $response->json('data');
        $checkoutUrl = (string) data_get($data, 'attributes.checkout_url');
        $checkoutId = (string) ($data['id'] ?? '');

        if ($checkoutId === '' || $checkoutUrl === '') {
            throw ValidationException::withMessages([
                'payment' => 'PayMongo did not return a checkout URL.',
            ]);
        }

        return [
            'checkout_session_id' => $checkoutId,
            'checkout_url' => $checkoutUrl,
            'reference' => 'PB-'.$transaction->id,
        ];
    }

    public function verifyWebhook(Request $request): bool
    {
        $secret = (string) config('payments.paymongo.webhook_secret');

        if ($secret === '') {
            return false;
        }

        $header = (string) $request->header('Paymongo-Signature');

        if ($header === '') {
            return false;
        }

        $parts = [];

        foreach (explode(',', $header) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, null);

            if ($key !== null && $value !== null) {
                $parts[$key] = $value;
            }
        }

        $timestamp = $parts['t'] ?? null;

        if ($timestamp === null) {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);

        foreach (['te', 'li'] as $key) {
            if (isset($parts[$key]) && hash_equals($expected, $parts[$key])) {
                return true;
            }
        }

        return false;
    }

    public function parseWebhook(array $payload): ?array
    {
        $event = (string) data_get($payload, 'data.attributes.type', '');

        if ($event === '') {
            return null;
        }

        $object = (array) data_get($payload, 'data.attributes.data', []);
        $type = (string) ($object['type'] ?? '');
        $attributes = (array) ($object['attributes'] ?? []);
        $metadata = (array) ($attributes['metadata'] ?? []);

        $transactionId = isset($metadata['transaction_id']) ? (int) $metadata['transaction_id'] : null;

        $checkoutSessionId = $type === 'checkout_session'
            ? ($object['id'] ?? null)
            : ($attributes['checkout_session_id'] ?? null);

        $payment = null;

        if ($type === 'payment') {
            $payment = $object;
        } elseif (! empty($attributes['payments'][0])) {
            $payment = (array) $attributes['payments'][0];
        }

        $paymentId = $payment['id'] ?? null;
        $method = data_get($payment, 'attributes.source.type');
        $amount = data_get($payment, 'attributes.amount');

        return [
            'event' => $event,
            'status' => $this->statusFor($event),
            'transaction_id' => $transactionId,
            'checkout_session_id' => $checkoutSessionId,
            'payment_id' => $paymentId,
            'method' => $method,
            'amount' => $amount === null ? null : round(((int) $amount) / 100, 2),
        ];
    }

    protected function client(string $secretKey): PendingRequest
    {
        return Http::baseUrl((string) config('payments.paymongo.base_url'))
            ->withBasicAuth($secretKey, '')
            ->acceptJson()
            ->asJson()
            ->timeout(20);
    }

    protected function descriptionFor(Transaction $transaction): string
    {
        if ($transaction->appointment !== null) {
            return $transaction->appointment->service?->name
                ?? 'Appointment #'.$transaction->appointment->id;
        }

        if ($transaction->packagePurchase !== null) {
            return $transaction->packagePurchase->servicePackage?->name
                ?? 'Package purchase #'.$transaction->packagePurchase->id;
        }

        return 'PetBook transaction #'.$transaction->id;
    }

    protected function appendTransaction(string $url, Transaction $transaction): string
    {
        $separator = str_contains($url, '?') ? '&' : '?';

        return $url.$separator.'transaction_id='.$transaction->id;
    }

    protected function statusFor(string $event): string
    {
        if (str_contains($event, 'paid') || str_contains($event, 'succeeded')) {
            return PaymentStatus::Paid->value;
        }

        if (str_contains($event, 'failed') || str_contains($event, 'expired')) {
            return PaymentStatus::Failed->value;
        }

        return PaymentStatus::Pending->value;
    }
}

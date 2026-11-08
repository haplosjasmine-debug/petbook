<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\AppointmentService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        protected AppointmentService $appointments,
        protected PaymentService $payments
    ) {
    }

    /**
     * Directus Flows call this endpoint after an appointment is created or
     * updated in the CMS. It re-applies Laravel's business rules (commission,
     * loyalty, reminders, records) on top of the shared database row.
     */
    public function directus(Request $request): JsonResponse
    {
        $secret = (string) config('petbook.directus.webhook_secret');

        if ($secret === '' || ! hash_equals($secret, (string) $request->header('X-Directus-Secret'))) {
            return response()->json(['message' => 'Invalid webhook signature.'], 403);
        }

        $payload = $request->all();
        $collection = $payload['collection'] ?? null;

        if ($collection !== 'appointments') {
            return response()->json(['message' => 'Ignored: not an appointment event.', 'checked' => true]);
        }

        $ids = $payload['keys'] ?? [];

        if ($ids === [] && isset($payload['payload']['id'])) {
            $ids = [$payload['payload']['id']];
        }

        $processed = [];

        foreach ($ids as $id) {
            $appointment = Appointment::find($id);

            if ($appointment === null) {
                continue;
            }

            $this->appointments->syncFromCms($appointment);
            $processed[] = $appointment->id;
        }

        Log::info('Directus appointment webhook processed', [
            'appointments' => $processed,
            'event' => $payload['event'] ?? null,
        ]);

        return response()->json([
            'message' => 'Appointment synced.',
            'processed' => $processed,
        ]);
    }

    /**
     * PayMongo sends checkout_session.payment.paid / payment.paid events here.
     * The signature is verified with PAYMONGO_WEBHOOK_SECRET.
     */
    public function paymongo(Request $request): JsonResponse
    {
        if (! $this->payments->verifyWebhook($request)) {
            return response()->json(['message' => 'Invalid PayMongo signature.'], 403);
        }

        $event = $this->payments->parseWebhook($request->all());

        if ($event === null) {
            return response()->json(['message' => 'Ignored: unsupported PayMongo event.']);
        }

        $transaction = $this->payments->applyWebhookEvent($event);

        Log::info('PayMongo webhook processed', [
            'event' => $event['event'],
            'transaction_id' => $transaction?->id,
            'payment_status' => $transaction?->payment_status?->value,
        ]);

        return response()->json([
            'message' => $transaction === null ? 'No matching transaction.' : 'Payment webhook processed.',
            'transaction_id' => $transaction?->id,
            'payment_status' => $transaction?->payment_status?->value,
        ]);
    }
}

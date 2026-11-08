<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Enums\ServiceCategory;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Pet;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PayMongoPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'payments.paymongo.secret_key' => 'sk_test_petbook',
            'payments.paymongo.webhook_secret' => 'whsec_petbook',
            'payments.paymongo.base_url' => 'https://api.paymongo.com/v1',
        ]);
    }

    public function test_checkout_creates_a_paymongo_session_for_an_appointment(): void
    {
        Http::fake([
            'api.paymongo.com/*' => Http::response([
                'data' => [
                    'id' => 'cs_test_123',
                    'type' => 'checkout_session',
                    'attributes' => ['checkout_url' => 'https://checkout.paymongo.com/cs_test_123'],
                ],
            ]),
        ]);

        [$owner, $appointment] = $this->appointmentFixture(price: 350);

        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/payments/checkout', [
            'appointment_id' => $appointment->id,
            'payment_methods' => ['gcash', 'maya', 'qrph'],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.checkout_url', 'https://checkout.paymongo.com/cs_test_123')
            ->assertJsonPath('data.checkout_session_id', 'cs_test_123')
            ->assertJsonPath('data.transaction.payment_status', 'pending');

        Http::assertSent(function (Request $request) use ($appointment) {
            $attributes = $request['data']['attributes'];

            return str_ends_with($request->url(), '/checkout_sessions')
                && $attributes['line_items'][0]['amount'] === 35000
                && $attributes['line_items'][0]['currency'] === 'PHP'
                && $attributes['payment_method_types'] === ['gcash', 'maya', 'qrph']
                && $attributes['metadata']['transaction_id'] === (string) $appointment->transaction->id;
        });
    }

    public function test_paymongo_paid_webhook_marks_the_transaction_paid(): void
    {
        Http::fake([
            'api.paymongo.com/*' => Http::response([
                'data' => [
                    'id' => 'cs_test_123',
                    'attributes' => ['checkout_url' => 'https://checkout.paymongo.com/cs_test_123'],
                ],
            ]),
        ]);

        [$owner, $appointment] = $this->appointmentFixture(price: 350);

        Sanctum::actingAs($owner);

        $this->postJson('/api/payments/checkout', ['appointment_id' => $appointment->id])->assertCreated();

        $transaction = $appointment->transaction()->firstOrFail();

        $response = $this->sendPayMongoWebhook([
            'data' => [
                'id' => 'evt_test_123',
                'type' => 'event',
                'attributes' => [
                    'type' => 'checkout_session.payment.paid',
                    'data' => [
                        'id' => 'cs_test_123',
                        'type' => 'checkout_session',
                        'attributes' => [
                            'metadata' => ['transaction_id' => (string) $transaction->id],
                            'payments' => [[
                                'id' => 'pay_test_123',
                                'type' => 'payment',
                                'attributes' => [
                                    'amount' => 35000,
                                    'currency' => 'PHP',
                                    'status' => 'paid',
                                    'source' => ['type' => 'gcash'],
                                ],
                            ]],
                        ],
                    ],
                ],
            ],
        ]);

        $response->assertOk()->assertJsonPath('payment_status', 'paid');

        $transaction->refresh();

        $this->assertSame('paid', $transaction->payment_status->value);
        $this->assertSame('gcash', $transaction->payment_method);
        $this->assertSame('pay_test_123', $transaction->payment_reference);
        $this->assertNotNull($transaction->payment_paid_at);
    }

    public function test_webhook_with_invalid_signature_is_rejected(): void
    {
        $payload = json_encode(['data' => ['attributes' => ['type' => 'payment.paid']]]);

        $response = $this->call(
            'POST',
            '/api/webhooks/paymongo',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
                'HTTP_PAYMONGO_SIGNATURE' => 't=123,te=not-a-real-signature',
            ],
            $payload
        );

        $response->assertForbidden();
    }

    public function test_business_staff_can_record_a_cash_payment(): void
    {
        $businessUser = User::factory()->business()->create();
        $business = Business::factory()->create(['owner_id' => $businessUser->id]);
        $owner = User::factory()->owner()->create();

        $transaction = Transaction::factory()->create([
            'business_id' => $business->id,
            'owner_id' => $owner->id,
            'amount' => 500,
            'commission_amount' => 50,
            'net_amount' => 450,
        ]);

        Sanctum::actingAs($businessUser);

        $this->postJson("/api/payments/{$transaction->id}/cash-paid")
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.payment_method', 'cash');

        $transaction->refresh();

        $this->assertSame('cash', $transaction->payment_method);
        $this->assertNotNull($transaction->payment_paid_at);
    }

    public function test_owner_cannot_record_a_cash_payment(): void
    {
        $owner = User::factory()->owner()->create();
        $business = Business::factory()->create();

        $transaction = Transaction::factory()->create([
            'business_id' => $business->id,
            'owner_id' => $owner->id,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson("/api/payments/{$transaction->id}/cash-paid")->assertForbidden();
    }

    /**
     * @return array{0: User, 1: Appointment}
     */
    protected function appointmentFixture(float $price): array
    {
        $owner = User::factory()->owner()->create();
        $businessUser = User::factory()->business()->create();
        $business = Business::factory()->create(['owner_id' => $businessUser->id]);
        $service = Service::factory()->create([
            'business_id' => $business->id,
            'category' => ServiceCategory::Grooming,
            'price' => $price,
        ]);
        $pet = Pet::factory()->create(['owner_id' => $owner->id]);

        $appointment = Appointment::factory()->create([
            'business_id' => $business->id,
            'owner_id' => $owner->id,
            'pet_id' => $pet->id,
            'service_id' => $service->id,
            'status' => AppointmentStatus::Confirmed,
            'price' => $price,
        ]);

        return [$owner, $appointment];
    }

    protected function sendPayMongoWebhook(array $payload)
    {
        $body = json_encode($payload);
        $timestamp = time();
        $signature = hash_hmac('sha256', $timestamp.'.'.$body, 'whsec_petbook');

        return $this->call(
            'POST',
            '/api/webhooks/paymongo',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
                'HTTP_PAYMONGO_SIGNATURE' => "t={$timestamp},te={$signature}",
            ],
            $body
        );
    }
}

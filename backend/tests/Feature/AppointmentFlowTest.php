<?php

namespace Tests\Feature;

use App\Enums\AppointmentStatus;
use App\Enums\ReminderStatus;
use App\Enums\ReminderType;
use App\Enums\ServiceCategory;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Pet;
use App\Models\Service;
use App\Models\User;
use App\Services\ReminderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AppointmentFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_completing_an_appointment_creates_commission_loyalty_record_and_follow_up(): void
    {
        [$owner, $businessUser, $business, $service, $pet] = $this->fixtures();

        $appointment = Appointment::factory()->create([
            'business_id' => $business->id,
            'owner_id' => $owner->id,
            'pet_id' => $pet->id,
            'service_id' => $service->id,
            'status' => AppointmentStatus::Confirmed,
            'price' => 200,
        ]);

        Sanctum::actingAs($businessUser);

        $this->patchJson("/api/appointments/{$appointment->id}/status", [
            'status' => 'completed',
            'record_notes' => 'Bath and tidy finished.',
            'weight_kg' => 8.4,
        ])->assertOk()->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('transactions', [
            'appointment_id' => $appointment->id,
            'amount' => 200,
            'commission_rate' => 0.1000,
            'commission_amount' => 20,
            'net_amount' => 180,
            'payment_status' => 'unpaid',
        ]);

        $this->assertSame(200, $owner->fresh()->loyalty_points);

        $this->assertDatabaseHas('loyalty_transactions', [
            'user_id' => $owner->id,
            'appointment_id' => $appointment->id,
            'points' => 200,
            'type' => 'earn',
        ]);

        $this->assertDatabaseHas('medical_records', [
            'appointment_id' => $appointment->id,
            'pet_id' => $pet->id,
            'type' => 'grooming',
            'weight_kg' => 8.4,
        ]);

        $this->assertDatabaseHas('reminders', [
            'appointment_id' => $appointment->id,
            'type' => ReminderType::FollowUp->value,
            'status' => ReminderStatus::Pending->value,
        ]);

        $this->assertNotNull($appointment->fresh()->completed_at);
    }

    public function test_pet_owner_cannot_change_an_appointment_status(): void
    {
        [$owner, $businessUser, $business, $service, $pet] = $this->fixtures();

        $appointment = Appointment::factory()->create([
            'business_id' => $business->id,
            'owner_id' => $owner->id,
            'pet_id' => $pet->id,
            'service_id' => $service->id,
            'status' => AppointmentStatus::Confirmed,
        ]);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/appointments/{$appointment->id}/status", [
            'status' => 'completed',
        ])->assertForbidden();

        $this->assertSame(AppointmentStatus::Confirmed, $appointment->fresh()->status);
    }

    public function test_cancelling_an_appointment_cancels_pending_reminders(): void
    {
        [$owner, $businessUser, $business, $service, $pet] = $this->fixtures();

        $appointment = Appointment::factory()->create([
            'business_id' => $business->id,
            'owner_id' => $owner->id,
            'pet_id' => $pet->id,
            'service_id' => $service->id,
            'status' => AppointmentStatus::Pending,
        ]);

        app(ReminderService::class)->scheduleUpcoming($appointment);

        $this->assertDatabaseHas('reminders', [
            'appointment_id' => $appointment->id,
            'status' => ReminderStatus::Pending->value,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson("/api/appointments/{$appointment->id}/cancel")->assertOk();

        $this->assertSame(AppointmentStatus::Cancelled, $appointment->fresh()->status);

        $this->assertDatabaseMissing('reminders', [
            'appointment_id' => $appointment->id,
            'status' => ReminderStatus::Pending->value,
        ]);
    }

    /**
     * @return array{0: User, 1: User, 2: Business, 3: Service, 4: Pet}
     */
    protected function fixtures(): array
    {
        $owner = User::factory()->owner()->create();
        $businessUser = User::factory()->business()->create();
        $business = Business::factory()->create(['owner_id' => $businessUser->id]);

        $service = Service::factory()->create([
            'business_id' => $business->id,
            'category' => ServiceCategory::Grooming,
            'price' => 200,
            'duration_min' => 45,
        ]);

        $pet = Pet::factory()->create(['owner_id' => $owner->id]);

        return [$owner, $businessUser, $business, $service, $pet];
    }
}

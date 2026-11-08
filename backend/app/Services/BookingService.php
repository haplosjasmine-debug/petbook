<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Enums\ServiceCategory;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\PackagePurchase;
use App\Models\Pet;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(protected ReminderService $reminders)
    {
    }

    public function create(User $owner, array $data): Appointment
    {
        return DB::transaction(function () use ($owner, $data) {
            $pet = Pet::where('owner_id', $owner->id)->find($data['pet_id']);

            if ($pet === null) {
                throw ValidationException::withMessages(['pet_id' => 'Select one of your own pets.']);
            }

            $business = Business::active()->find($data['business_id']);

            if ($business === null) {
                throw ValidationException::withMessages(['business_id' => 'This business is not accepting bookings.']);
            }

            $service = Service::where('business_id', $business->id)->active()->find($data['service_id']);

            if ($service === null) {
                throw ValidationException::withMessages(['service_id' => 'The selected service is not available.']);
            }

            if ($service->category === ServiceCategory::Package) {
                throw ValidationException::withMessages([
                    'service_id' => 'Packages are purchased separately, not booked directly.',
                ]);
            }

            $start = Carbon::parse($data['start_at']);

            if ($start->isPast()) {
                throw ValidationException::withMessages(['start_at' => 'Choose a start time in the future.']);
            }

            $end = (clone $start)->addMinutes($service->duration_min);

            $staffId = $data['staff_id'] ?? null;

            if ($staffId !== null) {
                $staff = Staff::where('business_id', $business->id)->active()->find($staffId);

                if ($staff === null) {
                    throw ValidationException::withMessages(['staff_id' => 'The selected staff member is unavailable.']);
                }

                $this->assertStaffAvailable($staffId, $start, $end);
            }

            $packagePurchase = null;
            $price = (float) $service->price;

            if (! empty($data['package_purchase_id'])) {
                $packagePurchase = PackagePurchase::where('owner_id', $owner->id)
                    ->where('pet_id', $pet->id)
                    ->with('servicePackage')
                    ->find($data['package_purchase_id']);

                if ($packagePurchase === null || ! $packagePurchase->isUsable()) {
                    throw ValidationException::withMessages([
                        'package_purchase_id' => 'This package is expired, fully used, or not yours.',
                    ]);
                }

                $included = $packagePurchase->servicePackage?->included_service_ids ?? [];

                if ($included !== [] && ! in_array($service->id, $included, true)) {
                    throw ValidationException::withMessages([
                        'package_purchase_id' => 'The selected service is not included in this package.',
                    ]);
                }

                $price = 0;
            }

            $appointment = Appointment::create([
                'business_id' => $business->id,
                'owner_id' => $owner->id,
                'pet_id' => $pet->id,
                'staff_id' => $staffId,
                'service_id' => $service->id,
                'package_purchase_id' => $packagePurchase?->id,
                'start_at' => $start,
                'end_at' => $end,
                'status' => AppointmentStatus::Pending,
                'price' => $price,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->reminders->scheduleUpcoming($appointment);

            return $appointment->fresh()->load($this->defaultRelations());
        });
    }

    public function reschedule(Appointment $appointment, CarbonInterface|string $startAt): Appointment
    {
        $start = Carbon::parse($startAt);

        if ($start->isPast()) {
            throw ValidationException::withMessages(['start_at' => 'Choose a start time in the future.']);
        }

        if (! $appointment->status->isActive()) {
            throw ValidationException::withMessages(['status' => 'Only active appointments can be rescheduled.']);
        }

        $minutes = $appointment->service?->duration_min ?? $appointment->durationMinutes();
        $end = (clone $start)->addMinutes($minutes);

        if ($appointment->staff_id !== null) {
            $this->assertStaffAvailable($appointment->staff_id, $start, $end, $appointment->id);
        }

        $appointment->update(['start_at' => $start, 'end_at' => $end, 'status' => AppointmentStatus::Pending]);

        $this->reminders->scheduleUpcoming($appointment->fresh());

        return $appointment->fresh()->load($this->defaultRelations());
    }

    public function cancel(Appointment $appointment): Appointment
    {
        if (! in_array($appointment->status, [AppointmentStatus::Pending, AppointmentStatus::Confirmed], true)) {
            throw ValidationException::withMessages([
                'status' => 'This appointment can no longer be cancelled.',
            ]);
        }

        $appointment->update([
            'status' => AppointmentStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        $this->reminders->cancelForAppointment($appointment);

        return $appointment->fresh()->load($this->defaultRelations());
    }

    public function assignStaff(Appointment $appointment, ?int $staffId): Appointment
    {
        if ($staffId !== null) {
            $staff = Staff::where('business_id', $appointment->business_id)->active()->find($staffId);

            if ($staff === null) {
                throw ValidationException::withMessages(['staff_id' => 'Select a staff member from this business.']);
            }

            $this->assertStaffAvailable($staffId, $appointment->start_at, $appointment->end_at, $appointment->id);
        }

        $appointment->update(['staff_id' => $staffId]);

        return $appointment->fresh()->load($this->defaultRelations());
    }

    protected function assertStaffAvailable(int $staffId, CarbonInterface $start, CarbonInterface $end, ?int $ignoreId = null): void
    {
        $conflict = Appointment::query()
            ->where('staff_id', $staffId)
            ->where('id', '!=', $ignoreId)
            ->whereIn('status', [
                AppointmentStatus::Pending->value,
                AppointmentStatus::Confirmed->value,
                AppointmentStatus::InProgress->value,
            ])
            ->where('start_at', '<', $end)
            ->where('end_at', '>', $start)
            ->exists();

        if ($conflict) {
            throw ValidationException::withMessages([
                'start_at' => 'The selected staff member already has an appointment at that time.',
            ]);
        }
    }

    /** @return array<int, string> */
    protected function defaultRelations(): array
    {
        return ['business', 'pet', 'service', 'staff', 'owner'];
    }
}

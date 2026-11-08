<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Enums\MedicalRecordType;
use App\Enums\PackageStatus;
use App\Enums\ServiceCategory;
use App\Models\Appointment;
use App\Models\MedicalRecord;
use App\Models\PackagePurchase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(
        protected CommissionService $commission,
        protected LoyaltyService $loyalty,
        protected ReminderService $reminders
    ) {
    }

    /**
     * Move an appointment to a new status and trigger the right side effects.
     */
    public function transition(Appointment $appointment, AppointmentStatus $status, array $context = []): Appointment
    {
        return DB::transaction(function () use ($appointment, $status, $context) {
            $appointment->refresh();

            if (! $appointment->status->canTransitionTo($status)) {
                throw ValidationException::withMessages([
                    'status' => "An appointment in '{$appointment->status->value}' status cannot be moved to '{$status->value}'.",
                ]);
            }

            $appointment->status = $status;

            if ($status === AppointmentStatus::Completed) {
                $appointment->completed_at = now();
            }

            if (in_array($status, [AppointmentStatus::Cancelled, AppointmentStatus::NoShow], true)) {
                $appointment->cancelled_at = now();
            }

            $appointment->save();

            if ($status === AppointmentStatus::Completed) {
                $this->handleCompletion($appointment, $context);
            }

            if (in_array($status, [AppointmentStatus::Cancelled, AppointmentStatus::NoShow], true)) {
                $this->reminders->cancelForAppointment($appointment);
            }

            return $appointment->fresh()->load(['business', 'pet', 'service', 'staff', 'owner', 'transaction']);
        });
    }

    /**
     * Apply completion side effects. Safe to call more than once, which makes
     * it suitable for the Directus webhook and the reconciliation command.
     */
    public function finalizeCompletion(Appointment $appointment, array $context = []): Appointment
    {
        $this->handleCompletion($appointment->fresh(), $context);

        return $appointment->fresh()->load(['business', 'pet', 'service', 'staff', 'owner', 'transaction']);
    }

    /**
     * Keep the database in sync when Directus (the CMS front-end) edits an
     * appointment directly. Directus writes to the shared tables, so Laravel
     * applies the same business rules afterwards.
     */
    public function syncFromCms(Appointment $appointment): Appointment
    {
        $appointment->refresh();

        if ($appointment->status === AppointmentStatus::Completed) {
            $this->finalizeCompletion($appointment);
        } elseif (in_array($appointment->status, [AppointmentStatus::Cancelled, AppointmentStatus::NoShow], true)) {
            $this->reminders->cancelForAppointment($appointment);
        } else {
            $this->reminders->scheduleUpcoming($appointment);
        }

        return $appointment->fresh();
    }

    protected function handleCompletion(Appointment $appointment, array $context): void
    {
        $appointment->loadMissing(['business', 'pet.owner', 'service', 'packagePurchase.servicePackage', 'owner']);

        if ($appointment->package_purchase_id !== null) {
            $this->consumePackageSession($appointment->packagePurchase);
        } else {
            $this->commission->recordForAppointment($appointment);

            $points = $this->loyalty->pointsForAmount((float) $appointment->price);

            $this->loyalty->award(
                $appointment->owner,
                $points,
                $appointment->id,
                null,
                'Points earned for completed appointment #'.$appointment->id
            );
        }

        $this->ensureMedicalRecord($appointment, $context);

        $this->reminders->scheduleFollowUp($appointment);
    }

    protected function consumePackageSession(?PackagePurchase $purchase): void
    {
        if ($purchase === null) {
            return;
        }

        $remaining = max(0, (int) $purchase->sessions_remaining - 1);

        $purchase->update([
            'sessions_remaining' => $remaining,
            'status' => $remaining === 0 ? PackageStatus::Completed : $purchase->status,
        ]);
    }

    protected function ensureMedicalRecord(Appointment $appointment, array $context): void
    {
        $exists = MedicalRecord::where('appointment_id', $appointment->id)->exists();

        if ($exists) {
            return;
        }

        $type = match ($appointment->service?->category) {
            ServiceCategory::Grooming => MedicalRecordType::Grooming,
            ServiceCategory::Veterinary => MedicalRecordType::Checkup,
            default => MedicalRecordType::Note,
        };

        MedicalRecord::create([
            'pet_id' => $appointment->pet_id,
            'business_id' => $appointment->business_id,
            'appointment_id' => $appointment->id,
            'staff_id' => $appointment->staff_id,
            'type' => $type,
            'title' => ($appointment->service?->name ?? 'Service').' completed',
            'description' => $context['record_notes'] ?? null,
            'weight_kg' => $context['weight_kg'] ?? null,
            'recorded_at' => now(),
        ]);
    }
}

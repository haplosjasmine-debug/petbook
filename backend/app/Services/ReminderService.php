<?php

namespace App\Services;

use App\Enums\ReminderChannel;
use App\Enums\ReminderStatus;
use App\Enums\ReminderType;
use App\Models\Appointment;
use App\Models\Reminder;
use App\Models\Vaccination;
use App\Services\Sms\SmsManager;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReminderService
{
    public function __construct(protected SmsManager $sms)
    {
    }

    public function scheduleUpcoming(Appointment $appointment): Reminder
    {
        $appointment->loadMissing(['owner', 'pet', 'business', 'service']);

        $sendAt = $appointment->start_at
            ->copy()
            ->subHours((int) config('petbook.reminder_lead_hours'));

        if ($sendAt->isPast()) {
            $sendAt = now();
        }

        $this->cancelPending($appointment, ReminderType::Upcoming);

        return Reminder::create([
            'appointment_id' => $appointment->id,
            'user_id' => $appointment->owner_id,
            'channel' => ReminderChannel::Sms,
            'type' => ReminderType::Upcoming,
            'send_at' => $sendAt,
            'status' => ReminderStatus::Pending,
            'message' => $this->upcomingMessage($appointment),
        ]);
    }

    public function scheduleFollowUp(Appointment $appointment): Reminder
    {
        $appointment->loadMissing(['owner', 'pet', 'business']);

        $existing = Reminder::where('appointment_id', $appointment->id)
            ->where('type', ReminderType::FollowUp->value)
            ->whereIn('status', [ReminderStatus::Pending->value, ReminderStatus::Sent->value])
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        return Reminder::create([
            'appointment_id' => $appointment->id,
            'user_id' => $appointment->owner_id,
            'channel' => ReminderChannel::Sms,
            'type' => ReminderType::FollowUp,
            'send_at' => now()->addDays((int) config('petbook.followup_days')),
            'status' => ReminderStatus::Pending,
            'message' => $this->followUpMessage($appointment),
        ]);
    }

    public function scheduleVaccinationReminders(): int
    {
        $window = now()->addDays((int) config('petbook.package_expiry_warning_days'));

        $due = Vaccination::with('pet.owner')
            ->whereNotNull('next_due_at')
            ->whereBetween('next_due_at', [now()->startOfDay(), $window->endOfDay()])
            ->get();

        $created = 0;

        foreach ($due as $vaccination) {
            $owner = $vaccination->pet?->owner;

            if ($owner === null) {
                continue;
            }

            $exists = Reminder::where('vaccination_id', $vaccination->id)
                ->where('type', ReminderType::Vaccination->value)
                ->whereIn('status', [ReminderStatus::Pending->value, ReminderStatus::Sent->value])
                ->exists();

            if ($exists) {
                continue;
            }

            Reminder::create([
                'vaccination_id' => $vaccination->id,
                'user_id' => $owner->id,
                'channel' => ReminderChannel::Sms,
                'type' => ReminderType::Vaccination,
                'send_at' => now(),
                'status' => ReminderStatus::Pending,
                'message' => "Hi {$owner->first_name}, {$vaccination->pet->name}'s {$vaccination->name} vaccination is due on "
                    .$vaccination->next_due_at->format('M j, Y').'. Book an appointment with your vet today.',
            ]);

            $created++;
        }

        return $created;
    }

    public function cancelForAppointment(Appointment $appointment): int
    {
        return Reminder::where('appointment_id', $appointment->id)
            ->where('status', ReminderStatus::Pending->value)
            ->update(['status' => ReminderStatus::Cancelled->value]);
    }

    /**
     * Send every reminder that is due. Intended to be run by the scheduler.
     *
     * @return array{sent: int, failed: int, skipped: int}
     */
    public function processDue(): array
    {
        $sent = 0;
        $failed = 0;
        $skipped = 0;

        $reminders = Reminder::with(['user', 'appointment'])
            ->due()
            ->orderBy('send_at')
            ->limit(200)
            ->get();

        foreach ($reminders as $reminder) {
            $phone = $reminder->user?->phone;

            if (! $phone) {
                $reminder->update([
                    'status' => ReminderStatus::Failed,
                    'provider_response' => 'Recipient has no phone number.',
                ]);
                $failed++;

                continue;
            }

            try {
                $result = $this->sms->send($phone, $reminder->message);

                $reminder->update([
                    'status' => $result['ok'] ? ReminderStatus::Sent : ReminderStatus::Failed,
                    'sent_at' => $result['ok'] ? now() : null,
                    'provider_response' => $result['provider'].': '.$result['response'],
                ]);

                if ($result['ok']) {
                    $sent++;

                    if ($reminder->type === ReminderType::Upcoming && $reminder->appointment !== null) {
                        $reminder->appointment->update(['reminder_sent_at' => now()]);
                    }
                } else {
                    $failed++;
                }
            } catch (\Throwable $e) {
                $reminder->update([
                    'status' => ReminderStatus::Failed,
                    'provider_response' => 'Exception: '.$e->getMessage(),
                ]);
                $failed++;
            }
        }

        return compact('sent', 'failed', 'skipped');
    }

    /**
     * @return Collection<int, Reminder>
     */
    public function pendingForUser(int $userId): Collection
    {
        return Reminder::where('user_id', $userId)
            ->where('status', ReminderStatus::Pending->value)
            ->orderBy('send_at')
            ->get();
    }

    protected function cancelPending(Appointment $appointment, ReminderType $type): void
    {
        Reminder::where('appointment_id', $appointment->id)
            ->where('type', $type->value)
            ->where('status', ReminderStatus::Pending->value)
            ->update(['status' => ReminderStatus::Cancelled->value]);
    }

    protected function upcomingMessage(Appointment $appointment): string
    {
        $owner = $appointment->owner;
        $pet = $appointment->pet;
        $business = $appointment->business;
        $service = $appointment->service?->name ?? 'appointment';

        return sprintf(
            'Hi %s, reminder: %s has a %s at %s on %s at %s. Reply to reschedule.',
            $owner?->first_name ?? 'there',
            $pet?->name ?? 'your pet',
            $service,
            $business?->name ?? 'the clinic',
            $appointment->start_at->format('M j, Y'),
            $appointment->start_at->format('g:i A')
        );
    }

    protected function followUpMessage(Appointment $appointment): string
    {
        $owner = $appointment->owner;
        $pet = $appointment->pet;
        $business = $appointment->business;

        return sprintf(
            'Hi %s, thanks for visiting %s! We hope %s is doing well. Book your next visit anytime.',
            $owner?->first_name ?? 'there',
            $business?->name ?? 'us',
            $pet?->name ?? 'your pet'
        );
    }
}

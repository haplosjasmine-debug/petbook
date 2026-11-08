<?php

namespace Database\Factories;

use App\Enums\ReminderChannel;
use App\Enums\ReminderStatus;
use App\Enums\ReminderType;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Reminder>
 */
class ReminderFactory extends Factory
{
    protected $model = Reminder::class;

    public function definition(): array
    {
        return [
            'appointment_id' => null,
            'vaccination_id' => null,
            'user_id' => User::factory(),
            'channel' => ReminderChannel::Sms,
            'type' => ReminderType::Upcoming,
            'send_at' => now(),
            'sent_at' => null,
            'status' => ReminderStatus::Pending,
            'message' => 'Reminder message',
            'provider_response' => null,
        ];
    }
}

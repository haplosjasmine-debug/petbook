<?php

namespace Database\Factories;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        $start = now()->addDay()->setMinute(0)->setSecond(0);

        return [
            'business_id' => Business::factory(),
            'owner_id' => User::factory(),
            'pet_id' => Pet::factory(),
            'service_id' => null,
            'staff_id' => null,
            'start_at' => $start,
            'end_at' => (clone $start)->addMinutes(30),
            'status' => AppointmentStatus::Pending,
            'price' => 25,
            'notes' => null,
        ];
    }
}

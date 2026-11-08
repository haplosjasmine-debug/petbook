<?php

namespace Database\Factories;

use App\Enums\StaffRole;
use App\Models\Business;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Staff>
 */
class StaffFactory extends Factory
{
    protected $model = Staff::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'user_id' => null,
            'name' => fake()->name(),
            'role' => fake()->randomElement(StaffRole::cases()),
            'email' => fake()->safeEmail(),
            'phone' => '+1555'.fake()->numerify('#######'),
            'bio' => fake()->sentence(10),
            'active' => true,
        ];
    }
}

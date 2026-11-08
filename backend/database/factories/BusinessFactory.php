<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Business>
 */
class BusinessFactory extends Factory
{
    protected $model = Business::class;

    public function definition(): array
    {
        $name = fake()->company().' Pet Care';

        return [
            'owner_id' => User::factory()->business(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('####'),
            'email' => fake()->companyEmail(),
            'phone' => '+1555'.fake()->numerify('#######'),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'description' => fake()->sentence(12),
            'commission_rate' => 0.10,
            'timezone' => 'UTC',
            'active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['active' => false]);
    }
}

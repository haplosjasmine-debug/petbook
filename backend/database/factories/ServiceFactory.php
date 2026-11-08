<?php

namespace Database\Factories;

use App\Enums\ServiceCategory;
use App\Models\Business;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->randomElement(['Bath & Brush', 'Full Groom', 'Nail Trim', 'Wellness Exam', 'Dental Check']),
            'category' => ServiceCategory::Grooming,
            'description' => fake()->sentence(10),
            'duration_min' => fake()->randomElement([20, 30, 45, 60, 90]),
            'price' => fake()->randomFloat(2, 15, 120),
            'active' => true,
        ];
    }
}

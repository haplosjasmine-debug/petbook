<?php

namespace Database\Factories;

use App\Models\Pet;
use App\Models\Vaccination;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Vaccination>
 */
class VaccinationFactory extends Factory
{
    protected $model = Vaccination::class;

    public function definition(): array
    {
        return [
            'pet_id' => Pet::factory(),
            'name' => fake()->randomElement(['Rabies', 'DHPP', 'Bordetella', 'FVRCP']),
            'administered_at' => now()->subYear(),
            'next_due_at' => now()->addMonths(2),
            'vet_name' => 'Dr. '.fake()->lastName(),
            'notes' => null,
        ];
    }
}

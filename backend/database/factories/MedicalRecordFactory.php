<?php

namespace Database\Factories;

use App\Enums\MedicalRecordType;
use App\Models\Business;
use App\Models\MedicalRecord;
use App\Models\Pet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MedicalRecord>
 */
class MedicalRecordFactory extends Factory
{
    protected $model = MedicalRecord::class;

    public function definition(): array
    {
        return [
            'pet_id' => Pet::factory(),
            'business_id' => Business::factory(),
            'appointment_id' => null,
            'staff_id' => null,
            'type' => MedicalRecordType::Note,
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'weight_kg' => fake()->randomFloat(2, 1, 45),
            'recorded_at' => now(),
        ];
    }
}

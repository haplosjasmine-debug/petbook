<?php

namespace Database\Factories;

use App\Enums\PetSex;
use App\Enums\Species;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pet>
 */
class PetFactory extends Factory
{
    protected $model = Pet::class;

    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'name' => fake()->firstName(),
            'species' => fake()->randomElement(Species::cases()),
            'breed' => fake()->word(),
            'sex' => fake()->randomElement(PetSex::cases()),
            'birth_date' => fake()->dateTimeBetween('-10 years', '-6 months'),
            'weight_kg' => fake()->randomFloat(2, 1, 45),
            'color' => fake()->colorName(),
            'microchip' => fake()->numerify('985############'),
            'notes' => fake()->sentence(8),
        ];
    }
}

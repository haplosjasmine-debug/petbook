<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\ServicePackage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ServicePackage>
 */
class ServicePackageFactory extends Factory
{
    protected $model = ServicePackage::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => 'Grooming Bundle',
            'description' => 'Prepay for several grooming sessions.',
            'price' => 100,
            'sessions' => 4,
            'validity_days' => 90,
            'included_service_ids' => [],
            'active' => true,
        ];
    }
}

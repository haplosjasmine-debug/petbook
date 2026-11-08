<?php

namespace Database\Factories;

use App\Enums\PackageStatus;
use App\Models\Business;
use App\Models\PackagePurchase;
use App\Models\Pet;
use App\Models\ServicePackage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PackagePurchase>
 */
class PackagePurchaseFactory extends Factory
{
    protected $model = PackagePurchase::class;

    public function definition(): array
    {
        return [
            'service_package_id' => ServicePackage::factory(),
            'business_id' => Business::factory(),
            'owner_id' => User::factory(),
            'pet_id' => Pet::factory(),
            'sessions_total' => 4,
            'sessions_remaining' => 4,
            'paid_amount' => 100,
            'expires_at' => now()->addDays(90),
            'status' => PackageStatus::Active,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Enums\LoyaltyType;
use App\Models\LoyaltyTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LoyaltyTransaction>
 */
class LoyaltyTransactionFactory extends Factory
{
    protected $model = LoyaltyTransaction::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'appointment_id' => null,
            'package_purchase_id' => null,
            'points' => 25,
            'type' => LoyaltyType::Earn,
            'description' => 'Loyalty points earned',
        ];
    }
}

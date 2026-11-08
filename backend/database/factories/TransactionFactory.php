<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Models\Business;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        $amount = 100;

        return [
            'business_id' => Business::factory(),
            'owner_id' => User::factory(),
            'appointment_id' => null,
            'package_purchase_id' => null,
            'amount' => $amount,
            'commission_rate' => 0.10,
            'commission_amount' => 10,
            'net_amount' => 90,
            'status' => TransactionStatus::Pending,
            'paid_at' => null,
            'payment_status' => PaymentStatus::Unpaid,
        ];
    }
}

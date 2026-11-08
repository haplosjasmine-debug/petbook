<?php

namespace App\Services;

use App\Enums\LoyaltyType;
use App\Models\LoyaltyTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoyaltyService
{
    public function pointsForAmount(float $amount): int
    {
        $perUnit = (float) config('petbook.loyalty_points_per_unit');

        return (int) floor($amount * $perUnit);
    }

    public function award(
        User $user,
        int $points,
        ?int $appointmentId = null,
        ?int $packagePurchaseId = null,
        string $description = 'Loyalty points earned'
    ): ?LoyaltyTransaction {
        if ($points <= 0) {
            return null;
        }

        return DB::transaction(function () use ($user, $points, $appointmentId, $packagePurchaseId, $description) {
            if ($appointmentId !== null && LoyaltyTransaction::where('appointment_id', $appointmentId)
                ->where('type', LoyaltyType::Earn->value)
                ->exists()) {
                return null;
            }

            $transaction = LoyaltyTransaction::create([
                'user_id' => $user->id,
                'appointment_id' => $appointmentId,
                'package_purchase_id' => $packagePurchaseId,
                'points' => $points,
                'type' => LoyaltyType::Earn,
                'description' => $description,
            ]);

            $user->increment('loyalty_points', $points);

            return $transaction;
        });
    }

    public function redeem(User $user, int $points, string $description = 'Loyalty points redeemed'): LoyaltyTransaction
    {
        if ($points <= 0) {
            throw ValidationException::withMessages(['points' => 'Points must be greater than zero.']);
        }

        return DB::transaction(function () use ($user, $points, $description) {
            $user->refresh();

            if ($user->loyalty_points < $points) {
                throw ValidationException::withMessages([
                    'points' => 'The customer does not have enough loyalty points.',
                ]);
            }

            $transaction = LoyaltyTransaction::create([
                'user_id' => $user->id,
                'points' => -$points,
                'type' => LoyaltyType::Redeem,
                'description' => $description,
            ]);

            $user->decrement('loyalty_points', $points);

            return $transaction;
        });
    }
}

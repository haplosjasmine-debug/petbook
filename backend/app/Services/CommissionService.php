<?php

namespace App\Services;

use App\Enums\TransactionStatus;
use App\Models\Appointment;
use App\Models\PackagePurchase;
use App\Models\Transaction;

class CommissionService
{
    /**
     * The developer/platform commission is a percentage of every completed
     * booking transaction (default 10%).
     */
    public function recordForAppointment(Appointment $appointment): Transaction
    {
        $existing = Transaction::where('appointment_id', $appointment->id)->first();

        if ($existing !== null) {
            return $existing;
        }

        $appointment->loadMissing('business');

        $amount = round((float) $appointment->price, 2);
        $rate = $appointment->business->commissionRate();

        return Transaction::create([
            'business_id' => $appointment->business_id,
            'owner_id' => $appointment->owner_id,
            'appointment_id' => $appointment->id,
            'amount' => $amount,
            'commission_rate' => $rate,
            'commission_amount' => round($amount * $rate, 2),
            'net_amount' => round($amount - ($amount * $rate), 2),
            'status' => TransactionStatus::Pending,
        ]);
    }

    public function recordForPackagePurchase(PackagePurchase $purchase): Transaction
    {
        $existing = Transaction::where('package_purchase_id', $purchase->id)->first();

        if ($existing !== null) {
            return $existing;
        }

        $purchase->loadMissing('business');

        $amount = round((float) $purchase->paid_amount, 2);
        $rate = $purchase->business->commissionRate();

        return Transaction::create([
            'business_id' => $purchase->business_id,
            'owner_id' => $purchase->owner_id,
            'package_purchase_id' => $purchase->id,
            'amount' => $amount,
            'commission_rate' => $rate,
            'commission_amount' => round($amount * $rate, 2),
            'net_amount' => round($amount - ($amount * $rate), 2),
            'status' => TransactionStatus::Pending,
        ]);
    }

    public function markPaid(Transaction $transaction): Transaction
    {
        $transaction->update([
            'status' => TransactionStatus::Paid,
            'paid_at' => now(),
        ]);

        return $transaction->fresh();
    }

    /**
     * Split a gross amount into the platform commission and business payout.
     *
     * @return array{amount: float, commission_rate: float, commission_amount: float, net_amount: float}
     */
    public function split(float $amount, float $rate): array
    {
        $amount = round($amount, 2);

        return [
            'amount' => $amount,
            'commission_rate' => $rate,
            'commission_amount' => round($amount * $rate, 2),
            'net_amount' => round($amount - ($amount * $rate), 2),
        ];
    }
}

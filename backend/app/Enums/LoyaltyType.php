<?php

namespace App\Enums;

enum LoyaltyType: string
{
    case Earn = 'earn';
    case Redeem = 'redeem';
    case Adjustment = 'adjustment';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}

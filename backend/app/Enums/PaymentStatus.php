<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Unpaid = 'unpaid';
    case Pending = 'pending';
    case Paid = 'paid';
    case Failed = 'failed';
    case Refunded = 'refunded';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    public function isPaid(): bool
    {
        return $this === self::Paid;
    }

    public function isSettled(): bool
    {
        return in_array($this, [self::Paid, self::Refunded], true);
    }
}

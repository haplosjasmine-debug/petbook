<?php

namespace App\Enums;

enum ReminderChannel: string
{
    case Sms = 'sms';
    case Email = 'email';

    public function label(): string
    {
        return strtoupper($this->value);
    }
}

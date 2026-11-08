<?php

namespace App\Enums;

enum ReminderType: string
{
    case Upcoming = 'upcoming';
    case FollowUp = 'follow_up';
    case Vaccination = 'vaccination';

    public function label(): string
    {
        return match ($this) {
            self::Upcoming => 'Appointment reminder',
            self::FollowUp => 'Follow-up reminder',
            self::Vaccination => 'Vaccination reminder',
        };
    }
}

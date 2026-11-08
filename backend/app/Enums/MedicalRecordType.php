<?php

namespace App\Enums;

enum MedicalRecordType: string
{
    case Grooming = 'grooming';
    case Treatment = 'treatment';
    case Vaccination = 'vaccination';
    case Checkup = 'checkup';
    case Note = 'note';

    public function label(): string
    {
        return match ($this) {
            self::Grooming => 'Grooming',
            self::Treatment => 'Treatment',
            self::Vaccination => 'Vaccination',
            self::Checkup => 'Check-up',
            self::Note => 'Note',
        };
    }
}

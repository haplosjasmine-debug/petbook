<?php

namespace App\Enums;

enum StaffRole: string
{
    case Groomer = 'groomer';
    case Vet = 'vet';
    case Assistant = 'assistant';
    case Manager = 'manager';

    public function label(): string
    {
        return match ($this) {
            self::Groomer => 'Groomer',
            self::Vet => 'Veterinarian',
            self::Assistant => 'Assistant',
            self::Manager => 'Manager',
        };
    }
}

<?php

namespace App\Enums;

enum ServiceCategory: string
{
    case Grooming = 'grooming';
    case Veterinary = 'veterinary';
    case Package = 'package';

    public function label(): string
    {
        return match ($this) {
            self::Grooming => 'Grooming',
            self::Veterinary => 'Veterinary',
            self::Package => 'Service package',
        };
    }
}

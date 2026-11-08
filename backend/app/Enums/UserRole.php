<?php

namespace App\Enums;

enum UserRole: string
{
    case Owner = 'owner';
    case Business = 'business';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Pet owner',
            self::Business => 'Business owner',
            self::Admin => 'Platform admin',
        };
    }
}

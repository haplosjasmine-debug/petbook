<?php

namespace App\Enums;

enum Species: string
{
    case Dog = 'dog';
    case Cat = 'cat';
    case Bird = 'bird';
    case Rabbit = 'rabbit';
    case Other = 'other';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}

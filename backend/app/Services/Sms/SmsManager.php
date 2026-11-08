<?php

namespace App\Services\Sms;

use App\Contracts\SmsGateway;

class SmsManager
{
    public function gateway(): SmsGateway
    {
        return app(SmsGateway::class);
    }

    public function send(string $to, string $message): array
    {
        return $this->gateway()->send($to, $message);
    }
}

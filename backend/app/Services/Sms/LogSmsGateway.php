<?php

namespace App\Services\Sms;

use App\Contracts\SmsGateway;
use Illuminate\Support\Facades\Log;

class LogSmsGateway implements SmsGateway
{
    public function send(string $to, string $message): array
    {
        Log::info('SMS (log driver)', [
            'to' => $to,
            'message' => $message,
        ]);

        return [
            'ok' => true,
            'provider' => 'log',
            'response' => 'Message written to the application log.',
        ];
    }
}

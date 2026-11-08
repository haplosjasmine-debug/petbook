<?php

namespace App\Services\Sms;

use App\Contracts\SmsGateway;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioSmsGateway implements SmsGateway
{
    public function send(string $to, string $message): array
    {
        $sid = (string) config('petbook.sms.twilio.account_sid');
        $token = (string) config('petbook.sms.twilio.auth_token');
        $from = (string) config('petbook.sms.twilio.from');

        if ($sid === '' || $token === '' || $from === '') {
            Log::warning('Twilio SMS is selected but credentials are incomplete.');

            return [
                'ok' => false,
                'provider' => 'twilio',
                'response' => 'Twilio credentials are incomplete.',
            ];
        }

        $response = Http::asForm()
            ->withBasicAuth($sid, $token)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To' => $to,
                'From' => $from,
                'Body' => $message,
            ]);

        return [
            'ok' => $response->successful(),
            'provider' => 'twilio',
            'response' => $response->successful()
                ? (string) ($response->json('sid') ?? 'sent')
                : $response->body(),
        ];
    }
}

<?php

namespace App\Contracts;

interface SmsGateway
{
    /**
     * Send an SMS message.
     *
     * @return array{ok: bool, provider: string, response: string}
     */
    public function send(string $to, string $message): array;
}

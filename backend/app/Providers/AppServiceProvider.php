<?php

namespace App\Providers;

use App\Contracts\SmsGateway;
use App\Services\Payments\PaymentGateway;
use App\Services\Payments\PayMongoGateway;
use App\Services\Sms\LogSmsGateway;
use App\Services\Sms\TwilioSmsGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SmsGateway::class, function () {
            return config('petbook.sms.provider') === 'twilio'
                ? new TwilioSmsGateway()
                : new LogSmsGateway();
        });

        $this->app->singleton(PaymentGateway::class, fn () => new PayMongoGateway());
    }

    public function boot(): void
    {
        //
    }
}

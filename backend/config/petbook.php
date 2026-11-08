<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Developer commission
    |--------------------------------------------------------------------------
    | The platform keeps a percentage of every completed booking transaction.
    */
    'commission_rate' => (float) env('PETBOOK_COMMISSION_RATE', 0.10),

    /*
    |--------------------------------------------------------------------------
    | Loyalty programme
    |--------------------------------------------------------------------------
    */
    'loyalty_points_per_unit' => (int) env('PETBOOK_LOYALTY_POINTS_PER_UNIT', 1),

    /*
    |--------------------------------------------------------------------------
    | Reminders
    |--------------------------------------------------------------------------
    */
    'reminder_lead_hours' => (int) env('PETBOOK_REMINDER_LEAD_HOURS', 24),
    'followup_days' => (int) env('PETBOOK_FOLLOWUP_DAYS', 3),
    'package_expiry_warning_days' => (int) env('PETBOOK_PACKAGE_EXPIRY_WARNING_DAYS', 14),
    'cron_secret' => env('CRON_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Directus CMS (the admin/user front-end)
    |--------------------------------------------------------------------------
    */
    'directus' => [
        'enabled' => (bool) env('DIRECTUS_ENABLED', false),
        'url' => rtrim((string) env('DIRECTUS_URL', 'http://localhost:8055'), '/'),
        'admin_email' => env('DIRECTUS_ADMIN_EMAIL'),
        'admin_password' => env('DIRECTUS_ADMIN_PASSWORD'),
        'webhook_secret' => env('DIRECTUS_WEBHOOK_SECRET'),
        'roles' => [
            'owner' => 'Pet Owner',
            'business' => 'Business Owner',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS provider
    |--------------------------------------------------------------------------
    */
    'sms' => [
        'provider' => env('SMS_PROVIDER', 'log'),
        'twilio' => [
            'account_sid' => env('TWILIO_ACCOUNT_SID'),
            'auth_token' => env('TWILIO_AUTH_TOKEN'),
            'from' => env('TWILIO_FROM'),
        ],
    ],
];

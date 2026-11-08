<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Online payments (Philippines)
    |--------------------------------------------------------------------------
    | PayMongo is the default gateway. It supports GCash, Maya, GrabPay,
    | QR Ph and Visa/Mastercard in a single hosted checkout page.
    */
    'default' => env('PAYMENT_PROVIDER', 'paymongo'),

    'currency' => env('PAYMENT_CURRENCY', 'PHP'),

    'success_url' => env('PAYMENT_SUCCESS_URL', 'http://localhost:8055/admin/content/transactions?payment=success'),
    'cancel_url' => env('PAYMENT_CANCEL_URL', 'http://localhost:8055/admin/content/transactions?payment=cancelled'),

    'paymongo' => [
        'secret_key' => env('PAYMONGO_SECRET_KEY'),
        'public_key' => env('PAYMONGO_PUBLIC_KEY'),
        'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
        'base_url' => rtrim((string) env('PAYMONGO_BASE_URL', 'https://api.paymongo.com/v1'), '/'),
        'payment_methods' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('PAYMONGO_PAYMENT_METHODS', 'gcash,maya,grab_pay,qrph,card'))
        ))),
    ],
];

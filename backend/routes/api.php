<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\CommissionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\LoyaltyController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\VaccinationController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public endpoints
|--------------------------------------------------------------------------
*/
Route::get('/health', HealthController::class);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::get('/businesses', [BusinessController::class, 'index']);
Route::get('/businesses/{business}', [BusinessController::class, 'show']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/packages', [PackageController::class, 'index']);

// Directus Flows -> Laravel (commission, loyalty, reminders)
Route::post('/webhooks/directus', [WebhookController::class, 'directus']);

// PayMongo -> Laravel (GCash, Maya, GrabPay, QR Ph, cards)
Route::post('/webhooks/paymongo', [WebhookController::class, 'paymongo']);

// Scheduler entry point (protect with X-Cron-Secret)
Route::post('/cron/reminders/process', [ReminderController::class, 'process'])
    ->middleware('cron.secret');

/*
|--------------------------------------------------------------------------
| Authenticated endpoints (Sanctum bearer token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::patch('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);

    Route::get('/pets', [PetController::class, 'index']);
    Route::get('/pets/{pet}', [PetController::class, 'show']);

    Route::get('/pets/{pet}/vaccinations', [VaccinationController::class, 'index']);
    Route::get('/pets/{pet}/medical-records', [MedicalRecordController::class, 'index']);

    Route::get('/reminders', [ReminderController::class, 'index']);

    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{transaction}', [PaymentController::class, 'show']);

    Route::get('/commissions', [CommissionController::class, 'index'])->middleware('role:business,admin');

    /*
    |--------------------------------------------------------------------------
    | Pet owner endpoints
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:owner,admin')->group(function () {
        Route::post('/pets', [PetController::class, 'store']);
        Route::match(['put', 'patch'], '/pets/{pet}', [PetController::class, 'update']);
        Route::delete('/pets/{pet}', [PetController::class, 'destroy']);

        Route::post('/appointments', [AppointmentController::class, 'store']);

        Route::post('/payments/checkout', [PaymentController::class, 'checkout']);

        Route::post('/pets/{pet}/vaccinations', [VaccinationController::class, 'store']);
        Route::match(['put', 'patch'], '/vaccinations/{vaccination}', [VaccinationController::class, 'update']);
        Route::delete('/vaccinations/{vaccination}', [VaccinationController::class, 'destroy']);

        Route::get('/loyalty', [LoyaltyController::class, 'index']);
        Route::post('/loyalty/redeem', [LoyaltyController::class, 'redeem']);

        Route::post('/packages/{package}/purchase', [PackageController::class, 'purchase']);
        Route::get('/package-purchases', [PackageController::class, 'myPurchases']);
    });

    /*
    |--------------------------------------------------------------------------
    | Business owner endpoints
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:business,admin')->group(function () {
        Route::patch('/businesses/{business}', [BusinessController::class, 'update']);

        Route::post('/services', [ServiceController::class, 'store']);
        Route::match(['put', 'patch'], '/services/{service}', [ServiceController::class, 'update']);
        Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::match(['put', 'patch'], '/staff/{staff}', [StaffController::class, 'update']);
        Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);

        Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
        Route::patch('/appointments/{appointment}/assign-staff', [AppointmentController::class, 'assignStaff']);

        Route::post('/payments/{transaction}/cash-paid', [PaymentController::class, 'markCashPaid']);

        Route::post('/pets/{pet}/medical-records', [MedicalRecordController::class, 'store']);
        Route::match(['put', 'patch'], '/medical-records/{medicalRecord}', [MedicalRecordController::class, 'update']);
        Route::delete('/medical-records/{medicalRecord}', [MedicalRecordController::class, 'destroy']);

        Route::post('/packages', [PackageController::class, 'store']);
        Route::match(['put', 'patch'], '/packages/{package}', [PackageController::class, 'update']);
        Route::delete('/packages/{package}', [PackageController::class, 'destroy']);
        Route::get('/business/package-purchases', [PackageController::class, 'businessPurchases']);

        Route::get('/reports/business', [ReportController::class, 'business']);
    });

    /*
    |--------------------------------------------------------------------------
    | Platform admin endpoints
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {
        Route::get('/reports/platform', [ReportController::class, 'platform']);
        Route::patch('/commissions/{transaction}/mark-paid', [CommissionController::class, 'markPaid']);
    });
});

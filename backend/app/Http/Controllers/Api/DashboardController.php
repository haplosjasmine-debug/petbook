<?php

namespace App\Http\Controllers\Api;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Transaction;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function __construct(protected ReportService $reports)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isOwner()) {
            return response()->json(['data' => [
                'role' => 'owner',
                'summary' => $this->reports->ownerSummary($user),
            ]]);
        }

        if ($user->isBusiness()) {
            $business = $this->businessFor($user);
            abort_if($business === null, 403, 'No business is linked to this account.');

            $today = Carbon::today();

            $todayAppointments = Appointment::forBusiness($business->id)
                ->whereBetween('start_at', [$today->copy()->startOfDay(), $today->copy()->endOfDay()]);

            return response()->json(['data' => [
                'role' => 'business',
                'summary' => [
                    'today' => [
                        'appointments' => (clone $todayAppointments)->count(),
                        'completed' => (clone $todayAppointments)->where('status', AppointmentStatus::Completed->value)->count(),
                        'revenue' => round((float) Transaction::forBusiness($business->id)
                            ->whereBetween('created_at', [$today->copy()->startOfDay(), $today->copy()->endOfDay()])
                            ->sum('amount'), 2),
                        'commission' => round((float) Transaction::forBusiness($business->id)
                            ->whereBetween('created_at', [$today->copy()->startOfDay(), $today->copy()->endOfDay()])
                            ->sum('commission_amount'), 2),
                    ],
                    'month' => $this->reports->businessSummary(
                        $business,
                        now()->startOfMonth(),
                        now()->endOfMonth()
                    ),
                    'today_schedule' => (clone $todayAppointments)
                        ->with(['pet:id,name', 'service:id,name', 'staff:id,name', 'owner:id,first_name,last_name'])
                        ->orderBy('start_at')
                        ->get(),
                    'upcoming' => Appointment::forBusiness($business->id)
                        ->upcoming()
                        ->with(['pet:id,name', 'service:id,name', 'staff:id,name'])
                        ->orderBy('start_at')
                        ->limit(10)
                        ->get(),
                ],
            ]]);
        }

        return response()->json(['data' => [
            'role' => 'admin',
            'summary' => $this->reports->platformSummary(now()->startOfMonth(), now()->endOfMonth()),
        ]]);
    }
}

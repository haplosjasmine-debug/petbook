<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\PackagePurchase;
use App\Models\Pet;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Revenue, commission and activity for a single business.
     *
     * @return array<string, mixed>
     */
    public function businessSummary(Business $business, CarbonInterface $from, CarbonInterface $to): array
    {
        $transactions = Transaction::forBusiness($business->id)
            ->whereBetween('created_at', [$from, $to]);

        $gross = (float) (clone $transactions)->sum('amount');
        $commission = (float) (clone $transactions)->sum('commission_amount');
        $net = (float) (clone $transactions)->sum('net_amount');

        $appointments = Appointment::forBusiness($business->id)
            ->whereBetween('start_at', [$from, $to]);

        $statusCounts = (clone $appointments)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $completed = Appointment::forBusiness($business->id)
            ->whereBetween('completed_at', [$from, $to])
            ->with('service')
            ->get();

        $topServices = $completed
            ->groupBy(fn (Appointment $appointment) => $appointment->service?->name ?? 'Other')
            ->map(fn ($group, $name) => [
                'service' => $name,
                'bookings' => $group->count(),
                'revenue' => round((float) $group->sum('price'), 2),
            ])
            ->sortByDesc('revenue')
            ->values()
            ->take(5)
            ->all();

        $daily = Transaction::forBusiness($business->id)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as day, SUM(amount) as revenue, SUM(commission_amount) as commission, SUM(net_amount) as net')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->day,
                'revenue' => round((float) $row->revenue, 2),
                'commission' => round((float) $row->commission, 2),
                'net' => round((float) $row->net, 2),
            ])
            ->all();

        return [
            'business' => [
                'id' => $business->id,
                'name' => $business->name,
                'commission_rate' => $business->commissionRate(),
            ],
            'period' => [
                'from' => Carbon::parse($from)->toDateString(),
                'to' => Carbon::parse($to)->toDateString(),
            ],
            'revenue' => [
                'gross' => round($gross, 2),
                'commission' => round($commission, 2),
                'net' => round($net, 2),
                'pending_commission' => round((float) Transaction::forBusiness($business->id)
                    ->where('status', 'pending')
                    ->sum('commission_amount'), 2),
            ],
            'appointments' => [
                'total' => (int) $statusCounts->sum(),
                'by_status' => $statusCounts,
                'completed' => (int) ($statusCounts[AppointmentStatus::Completed->value] ?? 0),
                'upcoming' => Appointment::forBusiness($business->id)->upcoming()->count(),
            ],
            'customers' => [
                'total' => (int) Appointment::forBusiness($business->id)->distinct('owner_id')->count('owner_id'),
                'pets' => (int) Pet::whereIn('owner_id', Appointment::forBusiness($business->id)->select('owner_id'))->count(),
            ],
            'top_services' => $topServices,
            'daily' => $daily,
        ];
    }

    /**
     * Platform-wide commission report for the developer/admin.
     *
     * @return array<string, mixed>
     */
    public function platformSummary(CarbonInterface $from, CarbonInterface $to): array
    {
        $transactions = Transaction::whereBetween('created_at', [$from, $to]);

        $gross = (float) (clone $transactions)->sum('amount');
        $commission = (float) (clone $transactions)->sum('commission_amount');
        $net = (float) (clone $transactions)->sum('net_amount');

        $byBusiness = Transaction::whereBetween('created_at', [$from, $to])
            ->with('business')
            ->selectRaw('business_id, SUM(amount) as revenue, SUM(commission_amount) as commission, SUM(net_amount) as net, COUNT(*) as transactions')
            ->groupBy('business_id')
            ->orderByDesc('commission')
            ->get()
            ->map(fn ($row) => [
                'business_id' => $row->business_id,
                'business' => $row->business?->name,
                'revenue' => round((float) $row->revenue, 2),
                'commission' => round((float) $row->commission, 2),
                'net' => round((float) $row->net, 2),
                'transactions' => (int) $row->transactions,
            ])
            ->all();

        $daily = Transaction::whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as day, SUM(amount) as revenue, SUM(commission_amount) as commission')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->day,
                'revenue' => round((float) $row->revenue, 2),
                'commission' => round((float) $row->commission, 2),
            ])
            ->all();

        return [
            'period' => [
                'from' => Carbon::parse($from)->toDateString(),
                'to' => Carbon::parse($to)->toDateString(),
            ],
            'totals' => [
                'gross' => round($gross, 2),
                'commission' => round($commission, 2),
                'net' => round($net, 2),
                'pending_commission' => round((float) Transaction::where('status', 'pending')->sum('commission_amount'), 2),
                'transactions' => (int) (clone $transactions)->count(),
            ],
            'businesses' => [
                'total' => Business::count(),
                'active' => Business::active()->count(),
            ],
            'customers' => [
                'pet_owners' => User::where('role', 'owner')->count(),
                'pets' => Pet::count(),
            ],
            'by_business' => $byBusiness,
            'daily' => $daily,
            'package_purchases' => PackagePurchase::whereBetween('created_at', [$from, $to])->count(),
        ];
    }

    /**
     * Dashboard summary for a pet owner.
     *
     * @return array<string, mixed>
     */
    public function ownerSummary(User $user): array
    {
        $upcoming = Appointment::where('owner_id', $user->id)
            ->upcoming()
            ->with(['business', 'pet', 'service', 'staff'])
            ->orderBy('start_at')
            ->limit(5)
            ->get();

        $nextVaccinations = $user->pets()
            ->with(['vaccinations' => fn ($query) => $query->whereNotNull('next_due_at')->orderBy('next_due_at')->limit(1)])
            ->get()
            ->flatMap(fn (Pet $pet) => $pet->vaccinations->map(fn ($vaccination) => [
                'pet_id' => $pet->id,
                'pet_name' => $pet->name,
                'vaccine' => $vaccination->name,
                'due_at' => $vaccination->next_due_at?->toDateString(),
                'overdue' => $vaccination->isOverdue(),
            ]))
            ->sortBy('due_at')
            ->values()
            ->take(5)
            ->all();

        return [
            'pets' => $user->pets()->count(),
            'upcoming_appointments' => $upcoming->count(),
            'next_appointments' => $upcoming,
            'loyalty_points' => (int) $user->loyalty_points,
            'total_spent' => round((float) Transaction::where('owner_id', $user->id)->sum('amount'), 2),
            'vaccinations_due' => $nextVaccinations,
            'active_packages' => $user->pets()
                ->with(['packagePurchases' => fn ($query) => $query->active()])
                ->get()
                ->flatMap(fn (Pet $pet) => $pet->packagePurchases)
                ->count(),
        ];
    }
}

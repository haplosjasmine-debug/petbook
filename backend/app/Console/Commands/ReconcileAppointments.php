<?php

namespace App\Console\Commands;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Console\Command;

class ReconcileAppointments extends Command
{
    protected $signature = 'petbook:reconcile-appointments';

    protected $description = 'Apply completion side effects for appointments completed outside the API';

    public function handle(AppointmentService $appointments): int
    {
        $pending = Appointment::query()
            ->where('status', AppointmentStatus::Completed->value)
            ->whereDoesntHave('transaction')
            ->whereDoesntHave('packagePurchase')
            ->where('completed_at', '<=', now()->subMinutes(5))
            ->limit(200)
            ->get();

        $applied = 0;

        foreach ($pending as $appointment) {
            $appointments->finalizeCompletion($appointment);
            $applied++;
        }

        $this->info("Reconciled {$applied} completed appointment(s).");

        return self::SUCCESS;
    }
}

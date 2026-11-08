<?php

namespace App\Console\Commands;

use App\Services\ReminderService;
use Illuminate\Console\Command;

class SendReminders extends Command
{
    protected $signature = 'petbook:send-reminders';

    protected $description = 'Generate vaccination reminders and send all due SMS reminders';

    public function handle(ReminderService $reminders): int
    {
        $created = $reminders->scheduleVaccinationReminders();
        $result = $reminders->processDue();

        $this->info(sprintf(
            'Vaccination reminders created: %d. Sent: %d, failed: %d.',
            $created,
            $result['sent'],
            $result['failed']
        ));

        return self::SUCCESS;
    }
}

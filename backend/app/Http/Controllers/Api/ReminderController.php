<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\ReminderStatus;
use App\Models\Reminder;
use App\Services\ReminderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function __construct(protected ReminderService $reminders)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Reminder::query()->with(['appointment:id,business_id,pet_id,start_at', 'user:id,first_name,last_name,phone']);

        if ($user->isOwner()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isBusiness()) {
            $business = $this->businessFor($user);
            abort_if($business === null, 403, 'No business is linked to this account.');

            $query->whereIn('appointment_id', function ($sub) use ($business) {
                $sub->select('id')->from('appointments')->where('business_id', $business->id);
            });
        }

        $reminders = $query
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('send_at')
            ->limit(200)
            ->get();

        return response()->json(['data' => $reminders]);
    }

    /**
     * Entry point for the scheduler. Creates vaccination reminders and sends
     * every reminder that is due.
     */
    public function process(): JsonResponse
    {
        $vaccinationReminders = $this->reminders->scheduleVaccinationReminders();
        $result = $this->reminders->processDue();

        return response()->json([
            'message' => 'Reminder run completed.',
            'vaccination_reminders_created' => $vaccinationReminders,
            'result' => $result,
        ]);
    }
}

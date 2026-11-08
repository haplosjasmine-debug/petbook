<?php

namespace App\Http\Controllers\Api;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\AppointmentService;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function __construct(
        protected BookingService $booking,
        protected AppointmentService $appointments
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Appointment::query()->with(['business:id,name,phone', 'pet:id,name,species', 'service:id,name,price', 'staff:id,name', 'owner:id,first_name,last_name,phone']);

        if ($user->isOwner()) {
            $query->where('owner_id', $user->id);
        } elseif ($user->isBusiness()) {
            $business = $this->businessFor($user);
            abort_if($business === null, 403, 'No business is linked to this account.');
            $query->where('business_id', $business->id);
        }

        $query
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('pet_id'), fn ($q) => $q->where('pet_id', $request->integer('pet_id')))
            ->when($request->filled('staff_id'), fn ($q) => $q->where('staff_id', $request->integer('staff_id')))
            ->when($request->filled('business_id') && $user->isAdmin(), fn ($q) => $q->where('business_id', $request->integer('business_id')))
            ->when($request->filled('from'), fn ($q) => $q->where('start_at', '>=', Carbon::parse($request->string('from'))->startOfDay()))
            ->when($request->filled('to'), fn ($q) => $q->where('start_at', '<=', Carbon::parse($request->string('to'))->endOfDay()));

        if ($request->boolean('upcoming')) {
            $query->where('start_at', '>=', now())
                ->whereIn('status', [
                    AppointmentStatus::Pending->value,
                    AppointmentStatus::Confirmed->value,
                    AppointmentStatus::InProgress->value,
                ])
                ->orderBy('start_at');
        } else {
            $query->orderByDesc('start_at');
        }

        $appointments = $query->paginate(min((int) $request->integer('per_page', 50), 100));

        return response()->json($appointments);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'business_id' => ['required', 'integer', 'exists:businesses,id'],
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'staff_id' => ['nullable', 'integer', 'exists:staff,id'],
            'package_purchase_id' => ['nullable', 'integer', 'exists:package_purchases,id'],
            'start_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment = $this->booking->create($request->user(), $data);

        return response()->json([
            'message' => 'Appointment booked. A reminder will be sent before the visit.',
            'data' => $appointment,
        ], 201);
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        $this->ensureAppointmentAccess($request->user(), $appointment);

        $appointment->load([
            'business:id,name,phone,address,city',
            'pet.owner:id,first_name,last_name,email,phone',
            'service',
            'staff:id,name,role',
            'transaction',
            'reminders',
            'medicalRecords.staff:id,name',
        ]);

        return response()->json(['data' => $appointment]);
    }

    public function updateStatus(Request $request, Appointment $appointment): JsonResponse
    {
        $this->ensureAppointmentAccess($request->user(), $appointment);
        abort_unless(
            $request->user()->isBusiness() || $request->user()->isAdmin(),
            403,
            'Only the business can change an appointment status.'
        );

        $data = $request->validate([
            'status' => ['required', Rule::enum(AppointmentStatus::class)],
            'record_notes' => ['nullable', 'string', 'max:5000'],
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:200'],
        ]);

        $appointment = $this->appointments->transition(
            $appointment,
            AppointmentStatus::from($data['status']),
            [
                'record_notes' => $data['record_notes'] ?? null,
                'weight_kg' => $data['weight_kg'] ?? null,
            ]
        );

        return response()->json(['message' => 'Appointment updated.', 'data' => $appointment]);
    }

    public function cancel(Request $request, Appointment $appointment): JsonResponse
    {
        $this->ensureAppointmentAccess($request->user(), $appointment);

        $appointment = $this->booking->cancel($appointment);

        return response()->json(['message' => 'Appointment cancelled.', 'data' => $appointment]);
    }

    public function reschedule(Request $request, Appointment $appointment): JsonResponse
    {
        $this->ensureAppointmentAccess($request->user(), $appointment);

        $data = $request->validate([
            'start_at' => ['required', 'date'],
        ]);

        $appointment = $this->booking->reschedule($appointment, $data['start_at']);

        return response()->json(['message' => 'Appointment rescheduled.', 'data' => $appointment]);
    }

    public function assignStaff(Request $request, Appointment $appointment): JsonResponse
    {
        $this->ensureAppointmentAccess($request->user(), $appointment);
        abort_unless(
            $request->user()->isBusiness() || $request->user()->isAdmin(),
            403,
            'Only the business can assign staff.'
        );

        $data = $request->validate([
            'staff_id' => ['nullable', 'integer', 'exists:staff,id'],
        ]);

        $appointment = $this->booking->assignStaff($appointment, $data['staff_id'] ?? null);

        return response()->json(['message' => 'Staff member assigned.', 'data' => $appointment]);
    }
}

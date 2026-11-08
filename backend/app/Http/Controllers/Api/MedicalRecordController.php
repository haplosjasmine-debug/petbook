<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\MedicalRecord;
use App\Models\Pet;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicalRecordController extends Controller
{
    public function index(Request $request, Pet $pet): JsonResponse
    {
        $this->ensurePetAccess($request->user(), $pet);

        $records = $pet->medicalRecords()
            ->with(['staff:id,name', 'business:id,name', 'appointment:id,start_at,service_id'])
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->orderByDesc('recorded_at')
            ->get();

        return response()->json(['data' => $records]);
    }

    public function store(Request $request, Pet $pet): JsonResponse
    {
        $this->ensurePetAccess($request->user(), $pet);

        $user = $request->user();
        $business = $this->businessFor($user);

        abort_if($business === null && ! $user->isAdmin(), 403, 'Only staff can add medical records.');

        $data = $this->validatePayload($request);

        if (! empty($data['appointment_id'])) {
            $appointment = Appointment::findOrFail($data['appointment_id']);
            abort_unless($appointment->pet_id === $pet->id, 422, 'The appointment does not belong to this pet.');

            if ($business !== null) {
                abort_unless($appointment->business_id === $business->id, 403, 'The appointment belongs to another business.');
            }
        }

        if (! empty($data['staff_id'])) {
            $staff = Staff::findOrFail($data['staff_id']);
            abort_unless($business === null || $staff->business_id === $business->id, 403, 'The staff member belongs to another business.');
        }

        $data['pet_id'] = $pet->id;
        $data['business_id'] = $business?->id;

        $record = MedicalRecord::create($data);

        return response()->json(['message' => 'Medical record added.', 'data' => $record->load('staff:id,name')], 201);
    }

    public function update(Request $request, MedicalRecord $medicalRecord): JsonResponse
    {
        $this->ensureMedicalRecordAccess($request, $medicalRecord);

        $medicalRecord->update($this->validatePayload($request, partial: true));

        return response()->json(['message' => 'Medical record updated.', 'data' => $medicalRecord->fresh()]);
    }

    public function destroy(Request $request, MedicalRecord $medicalRecord): JsonResponse
    {
        $this->ensureMedicalRecordAccess($request, $medicalRecord);

        $medicalRecord->delete();

        return response()->json(['message' => 'Medical record removed.']);
    }

    protected function ensureMedicalRecordAccess(Request $request, MedicalRecord $record): void
    {
        $user = $request->user();
        $business = $this->businessFor($user);

        if ($user->isAdmin()) {
            return;
        }

        if ($business !== null && $record->business_id === $business->id) {
            return;
        }

        if ($record->pet?->owner_id === $user->id) {
            abort(403, 'Only the clinic can edit medical records.');
        }

        abort(403, 'You do not have access to this record.');
    }

    protected function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'type' => [$required, 'in:grooming,treatment,vaccination,checkup,note'],
            'title' => [$required, 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:200'],
            'recorded_at' => [$required, 'date'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'staff_id' => ['nullable', 'integer', 'exists:staff,id'],
        ]);
    }
}

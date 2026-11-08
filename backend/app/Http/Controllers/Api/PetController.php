<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Pet::query()->with('owner:id,first_name,last_name,email,phone');

        if ($user->isOwner()) {
            $query->where('owner_id', $user->id);
        } elseif ($user->isBusiness()) {
            $business = $this->businessFor($user);
            abort_if($business === null, 403, 'No business is linked to this account.');

            $query->whereIn('owner_id', function ($sub) use ($business) {
                $sub->select('owner_id')
                    ->from('appointments')
                    ->where('business_id', $business->id);
            });
        }

        $pets = $query
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->withCount(['appointments', 'medicalRecords'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $pets]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);
        $data['owner_id'] = $request->user()->id;

        $pet = Pet::create($data);

        return response()->json(['message' => 'Pet added.', 'data' => $pet], 201);
    }

    public function show(Request $request, Pet $pet): JsonResponse
    {
        $this->ensurePetAccess($request->user(), $pet);

        $pet->load([
            'owner:id,first_name,last_name,email,phone',
            'vaccinations' => fn ($query) => $query->orderByDesc('administered_at'),
            'medicalRecords' => fn ($query) => $query->with('staff:id,name')->orderByDesc('recorded_at'),
            'appointments' => fn ($query) => $query->with(['business:id,name', 'service:id,name', 'staff:id,name'])->orderByDesc('start_at'),
            'packagePurchases.servicePackage',
        ]);

        return response()->json(['data' => $pet]);
    }

    public function update(Request $request, Pet $pet): JsonResponse
    {
        $this->ensurePetOwner($request, $pet);

        $pet->update($this->validatePayload($request, partial: true));

        return response()->json(['message' => 'Pet updated.', 'data' => $pet->fresh()]);
    }

    public function destroy(Request $request, Pet $pet): JsonResponse
    {
        $this->ensurePetOwner($request, $pet);

        $pet->delete();

        return response()->json(['message' => 'Pet removed.']);
    }

    protected function ensurePetOwner(Request $request, Pet $pet): void
    {
        abort_unless(
            $request->user()->isAdmin() || $pet->owner_id === $request->user()->id,
            403,
            'Only the pet owner can change this pet.'
        );
    }

    protected function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:100'],
            'species' => [$required, 'in:dog,cat,bird,rabbit,other'],
            'breed' => ['nullable', 'string', 'max:100'],
            'sex' => ['sometimes', 'in:male,female,unknown'],
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'],
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:200'],
            'color' => ['nullable', 'string', 'max:60'],
            'microchip' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'string', 'max:255'],
        ]);
    }
}

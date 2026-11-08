<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use App\Models\Vaccination;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VaccinationController extends Controller
{
    public function index(Request $request, Pet $pet): JsonResponse
    {
        $this->ensurePetAccess($request->user(), $pet);

        $vaccinations = $pet->vaccinations()->orderByDesc('administered_at')->get();

        return response()->json(['data' => $vaccinations]);
    }

    public function store(Request $request, Pet $pet): JsonResponse
    {
        $this->ensurePetAccess($request->user(), $pet);

        $vaccination = $pet->vaccinations()->create($this->validatePayload($request));

        return response()->json(['message' => 'Vaccination recorded.', 'data' => $vaccination], 201);
    }

    public function update(Request $request, Vaccination $vaccination): JsonResponse
    {
        $this->ensurePetAccess($request->user(), $vaccination->pet);

        $vaccination->update($this->validatePayload($request, partial: true));

        return response()->json(['message' => 'Vaccination updated.', 'data' => $vaccination->fresh()]);
    }

    public function destroy(Request $request, Vaccination $vaccination): JsonResponse
    {
        $this->ensurePetAccess($request->user(), $vaccination->pet);

        $vaccination->delete();

        return response()->json(['message' => 'Vaccination removed.']);
    }

    protected function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:120'],
            'administered_at' => [$required, 'date', 'before_or_equal:today'],
            'next_due_at' => ['nullable', 'date', 'after:administered_at'],
            'vet_name' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}

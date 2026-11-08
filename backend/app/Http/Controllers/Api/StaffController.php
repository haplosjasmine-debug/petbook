<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $business = $this->requireBusiness($request);

        $staff = Staff::where('business_id', $business->id)
            ->when($request->boolean('active_only', false), fn ($query) => $query->where('active', true))
            ->withCount('appointments')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $staff]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->requireBusiness($request);

        $data = $this->validatePayload($request);
        $data['business_id'] = $business->id;

        $staff = Staff::create($data);

        return response()->json(['message' => 'Staff member added.', 'data' => $staff], 201);
    }

    public function update(Request $request, Staff $staff): JsonResponse
    {
        $this->ensureBusinessAccess($request->user(), $staff->business);

        $staff->update($this->validatePayload($request, partial: true));

        return response()->json(['message' => 'Staff member updated.', 'data' => $staff->fresh()]);
    }

    public function destroy(Request $request, Staff $staff): JsonResponse
    {
        $this->ensureBusinessAccess($request->user(), $staff->business);

        $staff->update(['active' => false]);

        return response()->json(['message' => 'Staff member deactivated.']);
    }

    protected function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:150'],
            'role' => [$required, 'in:groomer,vet,assistant,manager'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:32'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'active' => ['sometimes', 'boolean'],
        ]);
    }

    protected function requireBusiness(Request $request): Business
    {
        $business = $this->businessFor($request->user());

        abort_if($business === null, 403, 'No business is linked to this account.');

        return $business;
    }
}

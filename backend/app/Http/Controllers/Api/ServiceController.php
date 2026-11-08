<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $services = Service::query()
            ->with('business:id,name')
            ->when($request->filled('business_id'), fn ($query) => $query->where('business_id', $request->integer('business_id')))
            ->when($request->filled('category'), fn ($query) => $query->where('category', $request->string('category')))
            ->when($request->boolean('active_only', true), fn ($query) => $query->where('active', true))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $services]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->requireBusiness($request);

        $data = $this->validatePayload($request);
        $data['business_id'] = $business->id;

        $service = Service::create($data);

        return response()->json(['message' => 'Service created.', 'data' => $service], 201);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $this->ensureBusinessAccess($request->user(), $service->business);

        $service->update($this->validatePayload($request, partial: true));

        return response()->json(['message' => 'Service updated.', 'data' => $service->fresh()]);
    }

    public function destroy(Request $request, Service $service): JsonResponse
    {
        $this->ensureBusinessAccess($request->user(), $service->business);

        $service->update(['active' => false]);

        return response()->json(['message' => 'Service deactivated.']);
    }

    protected function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:150'],
            'category' => [$required, 'in:grooming,veterinary,package'],
            'description' => ['nullable', 'string', 'max:2000'],
            'duration_min' => [$required, 'integer', 'min:5', 'max:600'],
            'price' => [$required, 'numeric', 'min:0', 'max:100000'],
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

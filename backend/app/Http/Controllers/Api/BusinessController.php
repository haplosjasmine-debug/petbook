<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $businesses = Business::active()
            ->withCount(['services' => fn ($query) => $query->where('active', true)])
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->string('search').'%'))
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'email', 'phone', 'address', 'city', 'description', 'logo', 'commission_rate', 'timezone', 'active']);

        return response()->json(['data' => $businesses]);
    }

    public function show(Business $business): JsonResponse
    {
        if (! $business->active) {
            abort(404);
        }

        $business->load([
            'services' => fn ($query) => $query->where('active', true),
            'servicePackages' => fn ($query) => $query->where('active', true),
            'staff' => fn ($query) => $query->where('active', true),
        ]);

        return response()->json(['data' => $business]);
    }

    public function update(Request $request, Business $business): JsonResponse
    {
        $this->ensureBusinessAccess($request->user(), $business);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'email' => ['sometimes', 'nullable', 'email', 'max:150'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'logo' => ['sometimes', 'nullable', 'string', 'max:255'],
            'timezone' => ['sometimes', 'timezone'],
        ]);

        $business->update($data);

        return response()->json([
            'message' => 'Business updated.',
            'data' => $business->fresh(),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Enums\PackageStatus;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\PackagePurchase;
use App\Models\Pet;
use App\Models\ServicePackage;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PackageController extends Controller
{
    public function __construct(protected CommissionService $commission)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $packages = ServicePackage::active()
            ->with('business:id,name')
            ->when($request->filled('business_id'), fn ($query) => $query->where('business_id', $request->integer('business_id')))
            ->orderBy('price')
            ->get();

        return response()->json(['data' => $packages]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->requireBusiness($request);

        $data = $this->validatePayload($request);
        $data['business_id'] = $business->id;

        $package = ServicePackage::create($data);

        return response()->json(['message' => 'Package created.', 'data' => $package], 201);
    }

    public function update(Request $request, ServicePackage $package): JsonResponse
    {
        $this->ensureBusinessAccess($request->user(), $package->business);

        $package->update($this->validatePayload($request, partial: true));

        return response()->json(['message' => 'Package updated.', 'data' => $package->fresh()]);
    }

    public function destroy(Request $request, ServicePackage $package): JsonResponse
    {
        $this->ensureBusinessAccess($request->user(), $package->business);

        $package->update(['active' => false]);

        return response()->json(['message' => 'Package deactivated.']);
    }

    public function purchase(Request $request, ServicePackage $package): JsonResponse
    {
        $user = $request->user();

        abort_unless($package->active, 422, 'This package is not available.');

        $data = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
        ]);

        $pet = Pet::where('owner_id', $user->id)->find($data['pet_id']);

        abort_if($pet === null, 422, 'Select one of your own pets.');

        $purchase = PackagePurchase::create([
            'service_package_id' => $package->id,
            'business_id' => $package->business_id,
            'owner_id' => $user->id,
            'pet_id' => $pet->id,
            'sessions_total' => $package->sessions,
            'sessions_remaining' => $package->sessions,
            'paid_amount' => $package->price,
            'expires_at' => Carbon::now()->addDays($package->validity_days),
            'status' => PackageStatus::Active,
        ]);

        $transaction = $this->commission->recordForPackagePurchase($purchase);

        return response()->json([
            'message' => 'Package purchased.',
            'data' => $purchase->load('servicePackage', 'pet'),
            'transaction' => $transaction,
        ], 201);
    }

    public function myPurchases(Request $request): JsonResponse
    {
        $purchases = PackagePurchase::where('owner_id', $request->user()->id)
            ->with(['servicePackage', 'pet', 'business:id,name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $purchases]);
    }

    public function businessPurchases(Request $request): JsonResponse
    {
        $business = $this->requireBusiness($request);

        $purchases = PackagePurchase::where('business_id', $business->id)
            ->with(['servicePackage', 'pet', 'owner:id,first_name,last_name,phone'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $purchases]);
    }

    protected function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => [$required, 'numeric', 'min:0', 'max:100000'],
            'sessions' => [$required, 'integer', 'min:1', 'max:100'],
            'validity_days' => [$required, 'integer', 'min:1', 'max:730'],
            'included_service_ids' => ['nullable', 'array'],
            'included_service_ids.*' => ['integer', 'exists:services,id'],
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

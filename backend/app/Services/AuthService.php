<?php

namespace App\Services;

use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Business;
use App\Models\Staff;
use App\Models\User;
use App\Services\Directus\DirectusProvisioner;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(protected DirectusProvisioner $provisioner)
    {
    }

    /**
     * @return array{user: User, business: ?Business, token: string}
     */
    public function register(array $data): array
    {
        $role = UserRole::from($data['role'] ?? UserRole::Owner->value);

        if (! in_array($role, [UserRole::Owner, UserRole::Business], true)) {
            throw ValidationException::withMessages([
                'role' => 'Only pet owners and business owners can register.',
            ]);
        }

        return DB::transaction(function () use ($data, $role) {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
                'role' => $role,
                'active' => true,
            ]);

            $business = null;

            if ($role === UserRole::Business) {
                $business = Business::create([
                    'owner_id' => $user->id,
                    'name' => $data['business_name'],
                    'slug' => $this->uniqueSlug($data['business_name']),
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                    'address' => $data['address'] ?? null,
                    'city' => $data['city'] ?? null,
                    'description' => $data['description'] ?? null,
                    'timezone' => $data['timezone'] ?? config('app.timezone', 'UTC'),
                    'commission_rate' => (float) config('petbook.commission_rate'),
                    'active' => true,
                ]);

                Staff::create([
                    'business_id' => $business->id,
                    'user_id' => $user->id,
                    'name' => $user->full_name,
                    'role' => StaffRole::Manager,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'active' => true,
                ]);

                $this->provisioner->provisionBusinessOwner($user, $business);
            } else {
                $this->provisioner->provisionPetOwner($user);
            }

            return [
                'user' => $user->fresh(),
                'business' => $business?->fresh(),
                'token' => $user->createToken($data['device'] ?? 'api')->plainTextToken,
            ];
        });
    }

    /**
     * @return array{user: User, business: ?Business, token: string}
     */
    public function login(string $email, string $password, string $device = 'api'): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->active) {
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        return [
            'user' => $user,
            'business' => $user->isBusiness() ? $user->primaryBusiness() : null,
            'token' => $user->createToken($device)->plainTextToken,
        ];
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token !== null && method_exists($token, 'delete')) {
            $token->delete();
        }
    }

    protected function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'business';
        $slug = $base;
        $counter = 1;

        while (Business::where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$counter);
        }

        return $slug;
    }
}

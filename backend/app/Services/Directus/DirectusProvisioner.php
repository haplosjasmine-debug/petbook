<?php

namespace App\Services\Directus;

use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Keeps the Directus CMS account for a business owner in sync with Laravel.
 *
 * Failures are intentionally non-fatal: the API must keep working even when the
 * CMS is temporarily unavailable. The account can be re-provisioned with
 * `php artisan directus:provision`.
 */
class DirectusProvisioner
{
    public function __construct(protected DirectusClient $client)
    {
    }

    public function isEnabled(): bool
    {
        return $this->client->enabled();
    }

    public function provisionBusinessOwner(User $owner, Business $business): ?string
    {
        if (! $this->client->enabled()) {
            return null;
        }

        try {
            $cmsUserId = $this->client->findOrCreateUser(
                [
                    'first_name' => $owner->first_name,
                    'last_name' => $owner->last_name,
                    'email' => $owner->email,
                    'password' => null,
                    'status' => 'active',
                ],
                config('petbook.directus.roles.business'),
                [
                    'business' => $business->id,
                    'app_role' => 'business',
                    'app_user' => $owner->id,
                ]
            );

            if ($cmsUserId !== null) {
                $business->forceFill(['cms_user_id' => $cmsUserId])->save();
            }

            return $cmsUserId;
        } catch (Throwable $e) {
            Log::warning('Unable to provision Directus account', [
                'business_id' => $business->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function provisionPetOwner(User $owner): ?string
    {
        if (! $this->client->enabled()) {
            return null;
        }

        try {
            return $this->client->findOrCreateUser(
                [
                    'first_name' => $owner->first_name,
                    'last_name' => $owner->last_name,
                    'email' => $owner->email,
                    'status' => 'active',
                ],
                config('petbook.directus.roles.owner'),
                [
                    'app_role' => 'owner',
                    'app_user' => $owner->id,
                ]
            );
        } catch (Throwable $e) {
            Log::warning('Unable to provision Directus pet-owner account', [
                'user_id' => $owner->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Business;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests;
    use ValidatesRequests;

    protected function businessFor(User $user): ?Business
    {
        return $user->isBusiness() ? $user->primaryBusiness() : null;
    }

    protected function ensurePetAccess(User $user, Pet $pet): void
    {
        if ($user->isAdmin() || $pet->owner_id === $user->id) {
            return;
        }

        if ($user->isBusiness()) {
            $business = $this->businessFor($user);

            if ($business !== null && $pet->appointments()->where('business_id', $business->id)->exists()) {
                return;
            }
        }

        abort(403, 'You do not have access to this pet.');
    }

    protected function ensureAppointmentAccess(User $user, Appointment $appointment): void
    {
        if ($user->isAdmin() || $appointment->owner_id === $user->id) {
            return;
        }

        if ($user->isBusiness()) {
            $business = $this->businessFor($user);

            if ($business !== null && $appointment->business_id === $business->id) {
                return;
            }
        }

        abort(403, 'You do not have access to this appointment.');
    }

    protected function ensureBusinessAccess(User $user, Business $business): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if ($user->isBusiness()) {
            $owned = $this->businessFor($user);

            if ($owned !== null && $owned->id === $business->id) {
                return;
            }
        }

        abort(403, 'You do not have access to this business.');
    }
}

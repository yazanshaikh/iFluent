<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    // super_admin bypasses all policies via Gate::before in AppServiceProvider

    /** CC / LP see only their own leads. Admin sees all. */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC, User::ROLE_SS]);
    }

    public function view(User $user, Lead $lead): bool
    {
        if ($user->isSuperAdmin()) return true;
        if (in_array($user->role, ['cc', 'ss']) && $lead->assigned_to === $user->id) return true;

        // CC can open ANY paid student (converted lead) — limited actions only,
        // see addRemark() / updateStatus().
        if ($user->isCC() && $lead->converted_at !== null) return true;

        // LP (SS) sees every Trial Booking like the admin, so they can open the
        // lead profile behind any booking (read access only — update() is unchanged).
        return $user->isSS()
            && $lead->sessionRequests()->where('type', \App\Models\SessionRequest::TYPE_DEMO)->exists();
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC]);
    }

    public function update(User $user, Lead $lead): bool
    {
        if ($user->isSuperAdmin()) return true;
        return in_array($user->role, ['cc', 'ss']) && $lead->assigned_to === $user->id;
    }

    public function delete(User $user, Lead $lead): bool
    {
        return $user->isSuperAdmin();
    }

    /** Only admin can forcibly recall a lead from any staff */
    public function recall(User $user, Lead $lead): bool
    {
        return $user->isSuperAdmin();
    }

    /** Admin assigns, CC can self-assign from open sea (if toggle enabled) */
    public function assign(User $user, Lead $lead): bool
    {
        return in_array($user->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC]);
    }

    /** CC can only toggle their own leads */
    public function toggleSmallTreasure(User $user, Lead $lead): bool
    {
        if ($user->isSuperAdmin()) return true;
        return in_array($user->role, ['cc', 'ss']) && $lead->assigned_to === $user->id;
    }

    /** Only admin can delete from small treasure */
    public function removeFromSmallTreasure(User $user, Lead $lead): bool
    {
        return $user->isSuperAdmin();
    }

    public function addRemark(User $user, Lead $lead): bool
    {
        if ($user->isSuperAdmin()) return true;
        if (in_array($user->role, ['cc', 'ss']) && $lead->assigned_to === $user->id) return true;

        // CC on a paid student they don't own: may add remarks
        return $user->isCC() && $lead->converted_at !== null;
    }

    /**
     * Change ONLY the status. Owners/admin via update(); CC may also do it on
     * any paid student (converted lead) they don't own.
     */
    public function updateStatus(User $user, Lead $lead): bool
    {
        if ($this->update($user, $lead)) return true;
        return $user->isCC() && $lead->converted_at !== null;
    }
}

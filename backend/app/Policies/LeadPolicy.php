<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    // super_admin bypasses all policies via Gate::before in AppServiceProvider

    /** CC sees only their own leads. Admin sees all. */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC]);
    }

    public function view(User $user, Lead $lead): bool
    {
        if ($user->isSuperAdmin()) return true;
        return $user->isCC() && $lead->assigned_to === $user->id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC]);
    }

    public function update(User $user, Lead $lead): bool
    {
        if ($user->isSuperAdmin()) return true;
        return $user->isCC() && $lead->assigned_to === $user->id;
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
        return $user->isCC() && $lead->assigned_to === $user->id;
    }

    /** Only admin can delete from small treasure */
    public function removeFromSmallTreasure(User $user, Lead $lead): bool
    {
        return $user->isSuperAdmin();
    }

    public function addRemark(User $user, Lead $lead): bool
    {
        if ($user->isSuperAdmin()) return true;
        return $user->isCC() && $lead->assigned_to === $user->id;
    }
}

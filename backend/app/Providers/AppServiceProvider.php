<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Super admin bypasses all gates
        Gate::before(function (User $user, string $ability) {
            if ($user->isSuperAdmin()) {
                return true;
            }
        });

        // ─── Lead Gates ───────────────────────────────────────────────────────
        Gate::define('view-leads', fn(User $u) =>
            in_array($u->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC])
        );

        Gate::define('create-lead', fn(User $u) =>
            in_array($u->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC])
        );

        Gate::define('assign-lead', fn(User $u) =>
            in_array($u->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC])
        );

        Gate::define('pull-open-sea', fn(User $u) =>
            in_array($u->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC])
        );

        Gate::define('view-open-sea', fn(User $u) =>
            in_array($u->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC, User::ROLE_SS])
        );

        // ─── Subscription / Payment Gates ─────────────────────────────────────
        Gate::define('activate-subscription', fn(User $u) =>
            in_array($u->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC])
        );

        Gate::define('approve-payment', fn(User $u) =>
            $u->isSuperAdmin()
        );

        // ─── Student Progress Gates (SS role) ─────────────────────────────────
        Gate::define('view-student-progress', fn(User $u) =>
            in_array($u->role, [User::ROLE_SUPER_ADMIN, User::ROLE_SS])
        );

        Gate::define('view-all-students', fn(User $u) =>
            in_array($u->role, [User::ROLE_SUPER_ADMIN, User::ROLE_SS])
        );

        // ─── Staff / Admin Management Gates ───────────────────────────────────
        Gate::define('manage-staff', fn(User $u) =>
            $u->isSuperAdmin()
        );

        Gate::define('create-teacher', fn(User $u) =>
            $u->isSuperAdmin()
        );

        Gate::define('view-staff-performance', fn(User $u) =>
            $u->isSuperAdmin()
        );

        Gate::define('manage-landing-page', fn(User $u) =>
            $u->isSuperAdmin()
        );

        // ─── Session / Booking Gates ──────────────────────────────────────────
        Gate::define('book-demo-session', fn(User $u) =>
            in_array($u->role, [User::ROLE_SUPER_ADMIN, User::ROLE_CC])
        );

        Gate::define('accept-session', fn(User $u) =>
            $u->isTeacher()
        );

        Gate::define('book-session', fn(User $u) =>
            $u->isStudent()
        );
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/v1/crm/dashboard
     * Returns a role-aware dashboard payload.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return match ($user->role) {
            User::ROLE_SUPER_ADMIN => $this->adminDashboard(),
            User::ROLE_CC          => $this->ccDashboard($user),
            User::ROLE_SS          => $this->ssDashboard(),
            default                => response()->json(['message' => 'Forbidden.'], 403),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUPER ADMIN DASHBOARD
    // ─────────────────────────────────────────────────────────────────────────
    private function adminDashboard(): JsonResponse
    {
        // ── Summary Cards ─────────────────────────────────────────────────────
        $summary = [
            'leads_today'        => Lead::whereDate('created_at', today())->count(),
            'conversions_today'  => Lead::where('status', Lead::STATUS_SUBSCRIBER)
                                        ->whereDate('converted_at', today())
                                        ->count(),
            'open_sea_count'     => Lead::where('status', Lead::STATUS_OPEN_SEA)->count(),
            'active_subscribers' => Subscription::where('status', Subscription::STATUS_ACTIVE)->count(),
            'pending_approvals'  => Subscription::where('status', Subscription::STATUS_PENDING)->count(),
            'total_leads'        => Lead::count(),
        ];

        // ── Staff Leaderboard (CC only, ranked by conversions this month) ─────
        $leaderboard = User::where('role', User::ROLE_CC)
            ->withCount([
                'assignedLeads as total_leads',
                'assignedLeads as conversions_this_month' => fn($q) =>
                    $q->where('status', Lead::STATUS_SUBSCRIBER)
                      ->whereMonth('converted_at', now()->month)
                      ->whereYear('converted_at', now()->year),
                'assignedLeads as working_leads' => fn($q) =>
                    $q->whereIn('status', [Lead::STATUS_ASSIGNED, Lead::STATUS_WORKING]),
                'assignedLeads as open_sea_leads' => fn($q) =>
                    $q->where('status', Lead::STATUS_OPEN_SEA),
            ])
            ->get()
            ->map(fn($staff) => [
                'id'                    => $staff->id,
                'name'                  => $staff->name,
                'total_leads'           => $staff->total_leads,
                'conversions_this_month'=> $staff->conversions_this_month,
                'working_leads'         => $staff->working_leads,
                'open_sea_leads'        => $staff->open_sea_leads,
                'conversion_rate'       => $staff->total_leads > 0
                    ? round(($staff->conversions_this_month / $staff->total_leads) * 100, 1)
                    : 0,
                'last_remark_at'        => $this->staffLastRemarkDate($staff->id),
            ])
            ->sortByDesc('conversions_this_month')
            ->values();

        // ── Lead Pipeline (status breakdown) ──────────────────────────────────
        $pipeline = Lead::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // ── Conversions trend (last 7 days) ───────────────────────────────────
        $trend = Lead::where('status', Lead::STATUS_SUBSCRIBER)
            ->where('converted_at', '>=', now()->subDays(6)->startOfDay())
            ->select(
                DB::raw("DATE(converted_at) as date"),
                DB::raw('count(*) as conversions')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(fn($r) => [$r->date => $r->conversions]);

        // Fill missing days with 0
        $trendFilled = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $trendFilled[$date] = $trend[$date] ?? 0;
        }

        return response()->json([
            'role'        => 'super_admin',
            'summary'     => $summary,
            'leaderboard' => $leaderboard,
            'pipeline'    => $pipeline,
            'trend'       => $trendFilled,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CC DASHBOARD — own stats only
    // ─────────────────────────────────────────────────────────────────────────
    private function ccDashboard(User $user): JsonResponse
    {
        $myLeads = Lead::where('assigned_to', $user->id);

        $summary = [
            'my_total_leads'         => (clone $myLeads)->count(),
            'my_leads_today'         => (clone $myLeads)->whereDate('created_at', today())->count(),
            'my_working_leads'       => (clone $myLeads)
                                            ->whereIn('status', [Lead::STATUS_ASSIGNED, Lead::STATUS_WORKING])
                                            ->count(),
            'my_conversions_month'   => (clone $myLeads)
                                            ->where('status', Lead::STATUS_SUBSCRIBER)
                                            ->whereMonth('converted_at', now()->month)
                                            ->whereYear('converted_at', now()->year)
                                            ->count(),
            'my_small_treasure'      => (clone $myLeads)->where('is_small_treasure', true)->count(),
            'pending_approvals'      => Subscription::where('activated_by', $user->id)
                                            ->where('status', Subscription::STATUS_PENDING)
                                            ->count(),
            'open_sea_available'     => Lead::where('status', Lead::STATUS_OPEN_SEA)->count(),
        ];

        // My pipeline breakdown
        $pipeline = (clone $myLeads)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // My recent leads (last 5)
        $recentLeads = (clone $myLeads)
            ->with('remarks')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($lead) => [
                'id'             => $lead->id,
                'name'           => $lead->name,
                'status'         => $lead->status,
                'last_remark_at' => $lead->remarks->first()?->created_at
                    ?->setTimezone('Asia/Amman')
                    ->format('Y-m-d H:i'),
                'created_at'     => $lead->created_at->toDateString(),
            ]);

        return response()->json([
            'role'         => 'cc',
            'summary'      => $summary,
            'pipeline'     => $pipeline,
            'recent_leads' => $recentLeads,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SS DASHBOARD — student progress overview
    // ─────────────────────────────────────────────────────────────────────────
    private function ssDashboard(): JsonResponse
    {
        $summary = [
            'total_active_students' => Subscription::where('status', Subscription::STATUS_ACTIVE)
                                            ->distinct('student_id')
                                            ->count('student_id'),
            'new_subscribers_today' => Subscription::where('status', Subscription::STATUS_ACTIVE)
                                            ->whereDate('activated_at', today())
                                            ->count(),
            'pending_approvals'     => Subscription::where('status', Subscription::STATUS_PENDING)->count(),
            // Phase 2: sessions & progress data will be added here
            // 'students_behind_schedule' => ...,
            // 'sessions_this_week'       => ...,
        ];

        // Active students list with subscription info
        $students = Subscription::where('status', Subscription::STATUS_ACTIVE)
            ->with(['student.user', 'package'])
            ->latest('activated_at')
            ->paginate(20);

        $studentList = $students->map(fn($sub) => [
            'student_id'     => $sub->student->id,
            'name'           => $sub->student->user->name,
            'package'        => $sub->package->name,
            'activated_at'   => $sub->activated_at?->toDateString(),
            'expires_at'     => $sub->expires_at?->toDateString(),
            // Phase 2: lessons_completed, sessions_booked, progress_pct
        ]);

        return response()->json([
            'role'        => 'ss',
            'summary'     => $summary,
            'students'    => $studentList,
            'pagination'  => [
                'current_page' => $students->currentPage(),
                'last_page'    => $students->lastPage(),
                'total'        => $students->total(),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper
    // ─────────────────────────────────────────────────────────────────────────
    private function staffLastRemarkDate(int $userId): ?string
    {
        $remark = DB::table('lead_remarks')
            ->where('staff_id', $userId)
            ->latest('created_at')
            ->value('created_at');

        return $remark
            ? \Carbon\Carbon::parse($remark)->setTimezone('Asia/Amman')->format('Y-m-d H:i')
            : null;
    }
}

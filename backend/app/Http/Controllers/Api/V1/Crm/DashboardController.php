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
        $start = now()->startOfMonth();
        $end   = now()->endOfMonth();

        // ── Summary Cards ─────────────────────────────────────────────────────
        $leadsThisMonth       = Lead::whereBetween('created_at', [$start, $end])->count();
        $conversionsThisMonth = Lead::whereNotNull('converted_at')
                                    ->whereBetween('converted_at', [$start, $end])
                                    ->count();
        $revenueThisMonth     = Subscription::whereIn('status', [
                                        Subscription::STATUS_ACTIVE,
                                        Subscription::STATUS_EXPIRED,
                                    ])
                                    ->whereBetween('activated_at', [$start, $end])
                                    ->sum('amount_paid');

        $summary = [
            'leads_this_month'        => $leadsThisMonth,
            'conversions_this_month'  => $conversionsThisMonth,
            'conversion_rate'         => $leadsThisMonth > 0
                                            ? round(($conversionsThisMonth / $leadsThisMonth) * 100, 1)
                                            : 0,
            'revenue_this_month'      => (float) $revenueThisMonth,
            'pending_approvals'       => Subscription::where('status', Subscription::STATUS_PENDING)->count(),
        ];

        // ── Staff Performance (CC only) ───────────────────────────────────────
        $ccUsers = User::where('role', User::ROLE_CC)->get();
        $ccIds   = $ccUsers->pluck('id');

        // Leads entered this month per employee (via first_assigned_to — never changes on recall)
        $leadsThisMonth = Lead::select('first_assigned_to', DB::raw('count(*) as cnt'))
            ->whereIn('first_assigned_to', $ccIds)
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('first_assigned_to')
            ->pluck('cnt', 'first_assigned_to');

        // Total leads ever first-assigned to each employee
        $totalLeads = Lead::select('first_assigned_to', DB::raw('count(*) as cnt'))
            ->whereIn('first_assigned_to', $ccIds)
            ->groupBy('first_assigned_to')
            ->pluck('cnt', 'first_assigned_to');

        // Conversions this month via subscriptions.activated_by (permanent, survives reassignment)
        $conversionsThisMonth = Subscription::select('activated_by', DB::raw('count(*) as cnt'))
            ->whereIn('activated_by', $ccIds)
            ->whereIn('status', [Subscription::STATUS_ACTIVE, Subscription::STATUS_EXPIRED])
            ->whereBetween('activated_at', [$start, $end])
            ->groupBy('activated_by')
            ->pluck('cnt', 'activated_by');

        $leaderboard = $ccUsers->map(function ($staff) use ($leadsThisMonth, $totalLeads, $conversionsThisMonth) {
            $leads       = $leadsThisMonth[$staff->id]       ?? 0;
            $conversions = $conversionsThisMonth[$staff->id] ?? 0;
            return [
                'id'                     => $staff->id,
                'name'                   => $staff->name,
                'leads_this_month'       => $leads,
                'conversions_this_month' => $conversions,
                'total_leads'            => $totalLeads[$staff->id] ?? 0,
                'conversion_rate'        => $leads > 0 ? round(($conversions / $leads) * 100, 1) : 0,
            ];
        })->sortByDesc('conversions_this_month')->values();

        return response()->json([
            'role'        => 'super_admin',
            'summary'     => $summary,
            'leaderboard' => $leaderboard,
            'period'      => [
                'start' => $start->toDateString(),
                'end'   => $end->toDateString(),
                'label' => $start->locale('ar')->translatedFormat('F Y'),
            ],
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

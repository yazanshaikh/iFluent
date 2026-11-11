<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LeadResource;
use App\Models\Lead;
use App\Models\Subscription;
use App\Models\SubscriptionCancellationRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaidStudentController extends Controller
{
    /**
     * GET /crm/paid-students
     * super_admin → every converted lead (+ the LP list to assign them).
     * CC          → every converted lead, read-only on this page.
     * SS (LP)     → only the paid students assigned to them.
     *
     * A student who is no longer subscribed (subscription cancelled, expired,
     * or none at all) stays on the list for NOT_SUBSCRIBED_GRACE_DAYS after it
     * ended, then drops off. Active / pending-approval students always show.
     *
     * Filters: ?phone=&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&page=
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'phone'     => ['nullable', 'string', 'max:20'],
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = Lead::whereNotNull('converted_at')
            ->with([
                'assignedTo:id,name,role',
                'student.user:id,lesson_credits',
                'student.teacher:id,name,deleted_at',
                'student.subscriptions' => fn($q) => $q
                    ->whereIn('status', [
                        Subscription::STATUS_ACTIVE,
                        Subscription::STATUS_PENDING,
                        Subscription::STATUS_EXPIRED,
                    ])
                    ->latest('activated_at'),
            ])
            ->latest('converted_at');

        $this->onlySubscribedOrRecentlyEnded($query);

        if ($request->user()->isSS()) {
            $query->where('assigned_to', $request->user()->id);
        }

        if ($request->filled('phone')) {
            $phone = \App\Support\Phone::searchFragment($request->phone);
            if ($phone !== null) {
                $query->where('phone', 'like', "%{$phone}%");
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('converted_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('converted_at', '<=', $request->date_to);
        }

        $leads = $query->paginate(20)->withQueryString();

        // Which of the listed subscriptions already have a pending cancellation request
        $subIds = $leads->getCollection()
            ->map(fn (Lead $l) => $l->student?->subscriptions?->first()?->id)
            ->filter()->values();
        $pendingCancel = SubscriptionCancellationRequest::whereIn('subscription_id', $subIds)
            ->where('status', SubscriptionCancellationRequest::STATUS_PENDING)
            ->pluck('subscription_id')->flip();

        return response()->json([
            'data' => $leads->map(function (Lead $lead) use ($pendingCancel, $request) {
                $sub = $lead->student?->subscriptions?->first();

                return [
                    'id'           => $lead->id,
                    'name'         => $lead->name,
                    'phone'        => LeadResource::phoneFor($lead, $request->user()),
                    'converted_at' => $lead->converted_at?->toIso8601String(),
                    'assigned_to'  => $lead->assignedTo
                        ? ['id' => $lead->assignedTo->id, 'name' => $lead->assignedTo->name, 'role' => $lead->assignedTo->role]
                        : null,
                    'teacher'      => $lead->student?->teacher
                        ? ['id' => $lead->student->teacher->id, 'name' => $lead->student->teacher->name]
                        : null,
                    'subscription' => $sub ? [
                        'id'             => $sub->id,
                        'amount_paid'    => (float) $sub->amount_paid,
                        'lessons_count'  => $sub->lessons_count,
                        'months_count'   => $sub->months_count,
                        'subscription_type' => $sub->subscription_type,
                        'status'         => $sub->status,
                        'activated_at'   => $sub->activated_at?->toIso8601String(),
                        'expires_at'     => $sub->expires_at?->toIso8601String(),
                        'has_pending_cancellation' => $pendingCancel->has($sub->id),
                        'remaining_lessons' => (int) ($lead->student?->user?->lesson_credits ?? 0),
                        // CC doesn't get the renewal reminder
                        'is_near_end' => !$request->user()->isCC()
                            && $lead->student->subscriptions->contains('status', Subscription::STATUS_ACTIVE)
                            && (int) ($lead->student->user?->lesson_credits ?? 0) <= Subscription::NEAR_END_LESSONS,
                    ] : null,
                ];
            }),
            'meta' => [
                'current_page' => $leads->currentPage(),
                'last_page'    => $leads->lastPage(),
                'total'        => $leads->total(),
                'per_page'     => $leads->perPage(),
            ],
            // Admin only: follow-up (LP) staff the admin can assign students to
            'lp_staff' => $request->user()->isSuperAdmin()
                ? User::where('role', User::ROLE_SS)->orderBy('name')->get(['id', 'name'])
                : [],
        ]);
    }

    /**
     * Keep a converted lead on the list when it:
     *   - has an active or pending-approval subscription, or
     *   - stopped being subscribed less than NOT_SUBSCRIBED_GRACE_DAYS ago:
     *       cancelled / expired → counted from when it actually ended (updated_at);
     *       a package can expire long after its end date, once its lessons run out
     *       no subscription at all → counted from converted_at
     */
    private function onlySubscribedOrRecentlyEnded($query): void
    {
        $cutoff = now()->subDays(Subscription::NOT_SUBSCRIBED_GRACE_DAYS);

        $query->where(function ($q) use ($cutoff) {
            $q->whereHas('student.subscriptions', fn ($s) => $s
                    ->whereIn('status', [Subscription::STATUS_ACTIVE, Subscription::STATUS_PENDING]))
              ->orWhereHas('student.subscriptions', fn ($s) => $s
                    ->whereIn('status', [Subscription::STATUS_CANCELLED, Subscription::STATUS_EXPIRED])
                    ->where('updated_at', '>=', $cutoff))
              ->orWhere(fn ($n) => $n
                    ->where('converted_at', '>=', $cutoff)
                    ->whereDoesntHave('student.subscriptions', fn ($s) => $s->whereIn('status', [
                        Subscription::STATUS_ACTIVE, Subscription::STATUS_PENDING,
                        Subscription::STATUS_CANCELLED, Subscription::STATUS_EXPIRED,
                    ])));
        });
    }

    /**
     * GET /crm/paid-students/near-end-count — sidebar badge (admin + LP).
     * Same visibility as the list: LP only counts the students assigned to them.
     */
    public function nearEndCount(Request $request): JsonResponse
    {
        $count = Lead::whereNotNull('converted_at')
            ->whereHas('student', fn ($student) => $student
                ->whereHas('subscriptions', fn ($s) => $s->where('status', Subscription::STATUS_ACTIVE))
                ->whereHas('user', fn ($u) => $u->where('lesson_credits', '<=', Subscription::NEAR_END_LESSONS)))
            ->when($request->user()->isSS(), fn ($q) => $q->where('assigned_to', $request->user()->id))
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * POST /admin/paid-students/{lead}/assign   { user_id }
     * Admin hands a paid student to a follow-up (LP / ss) staff member.
     * Moves ownership (assigned_to) but — unlike LeadController::assign —
     * keeps the lead's status (a subscriber stays a subscriber).
     */
    public function assign(Request $request, Lead $lead): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer'],
        ]);

        if ($lead->converted_at === null) {
            return response()->json(['message' => 'هذه الليدة ليست طالباً مشتركاً.'], 422);
        }

        $lp = User::where('role', User::ROLE_SS)->find($data['user_id']);
        if (!$lp) {
            return response()->json(['message' => 'يمكن التعيين لموظفي المتابعة (LP) فقط.'], 422);
        }

        $lead->update(['assigned_to' => $lp->id]);

        return response()->json([
            'message'     => "تم تعيين الطالب لـ {$lp->name}.",
            'assigned_to' => ['id' => $lp->id, 'name' => $lp->name, 'role' => $lp->role],
        ]);
    }
}

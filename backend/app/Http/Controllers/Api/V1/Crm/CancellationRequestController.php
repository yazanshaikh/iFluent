<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionCancellationRequest as CancelRequest;
use App\Services\SubscriptionCancellationService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Subscription cancellation requests.
 *
 *  SS (LP)     → store (raise a request on THEIR student), mine (their own requests),
 *                withdraw (pull back their own pending request)
 *  super_admin → index (all), approve, reject
 *
 * Raising a request never touches the subscription; only approve() does,
 * through SubscriptionCancellationService (same logic as the admin button).
 */
class CancellationRequestController extends Controller
{
    /** POST /crm/subscriptions/{subscription}/cancellation-requests */
    public function store(Request $request, Subscription $subscription): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        if ($subscription->student?->lead?->assigned_to !== $request->user()->id) {
            return response()->json(['message' => 'يمكنك طلب الإلغاء للطلاب المعيّنين لك فقط.'], 403);
        }

        if (!$subscription->isActive()) {
            return response()->json(['message' => 'الاشتراك غير نشط، لا يمكن طلب إلغائه.'], 422);
        }

        $alreadyPending = CancelRequest::where('subscription_id', $subscription->id)
            ->where('status', CancelRequest::STATUS_PENDING)
            ->exists();

        if ($alreadyPending) {
            return response()->json(['message' => 'يوجد طلب إلغاء قيد المراجعة لهذا الاشتراك.'], 422);
        }

        try {
            $cancelRequest = CancelRequest::create([
                'subscription_id' => $subscription->id,
                'student_id'      => $subscription->student_id,
                'requested_by'    => $request->user()->id,
                'reason'          => trim($data['reason']),
                'status'          => CancelRequest::STATUS_PENDING,
            ]);
        } catch (QueryException $e) {
            // Partial unique index (one pending per subscription) — lost a race.
            if ($e->getCode() === '23505') {
                return response()->json(['message' => 'يوجد طلب إلغاء قيد المراجعة لهذا الاشتراك.'], 422);
            }
            throw $e;
        }

        return response()->json([
            'message' => 'تم إرسال طلب الإلغاء للإدارة.',
            'data'    => $this->present($cancelRequest->load($this->relations())),
        ], 201);
    }

    /** GET /crm/cancellation-requests/mine */
    public function mine(Request $request): JsonResponse
    {
        $query = CancelRequest::where('requested_by', $request->user()->id)
            ->with($this->relations())
            ->latest();

        $this->applyFilters($query, $request);

        return $this->paginated($query->paginate(20)->withQueryString());
    }

    /**
     * POST /crm/cancellation-requests/{cancellationRequest}/withdraw
     * The LP who raised a request pulls it back while it is still pending.
     * No reason needed; the subscription is untouched.
     */
    public function withdraw(Request $request, CancelRequest $cancellationRequest): JsonResponse
    {
        $user = $request->user();

        $result = DB::transaction(function () use ($cancellationRequest, $user) {
            $req = CancelRequest::whereKey($cancellationRequest->id)->lockForUpdate()->first();

            if ($req->requested_by !== $user->id) {
                return response()->json(['message' => 'يمكنك إلغاء طلباتك فقط.'], 403);
            }

            if (!$req->isPending()) {
                return response()->json(['message' => 'لا يمكن إلغاء طلب تمت مراجعته.'], 422);
            }

            $req->update(['status' => CancelRequest::STATUS_WITHDRAWN]);

            return null;
        });

        if ($result) return $result;

        return response()->json([
            'message' => 'تم إلغاء الطلب.',
            'data'    => $this->present($cancellationRequest->fresh()->load($this->relations())),
        ]);
    }

    /** GET /admin/cancellation-requests?status=&phone= */
    public function index(Request $request): JsonResponse
    {
        $query = CancelRequest::with($this->relations())->latest();

        $this->applyFilters($query, $request);

        return response()->json([
            ...$this->paginated($query->paginate(20)->withQueryString())->getData(true),
            'pending_count' => CancelRequest::where('status', CancelRequest::STATUS_PENDING)->count(),
        ]);
    }

    /** POST /admin/cancellation-requests/{cancellationRequest}/approve */
    public function approve(
        Request $request,
        CancelRequest $cancellationRequest,
        SubscriptionCancellationService $cancellation,
    ): JsonResponse {
        $admin = $request->user();

        $result = DB::transaction(function () use ($cancellationRequest, $cancellation, $admin) {
            $req = CancelRequest::whereKey($cancellationRequest->id)->lockForUpdate()->first();

            if (!$req->isPending()) {
                return response()->json(['message' => 'تمت مراجعة هذا الطلب مسبقاً.'], 422);
            }

            $subscription = $req->subscription;

            if ($subscription->isActive()) {
                $requester = $req->requestedBy?->name ?? '—';
                $cancellation->cancel($subscription, $admin, "{$req->reason} (طلب من {$requester})");
            }

            $req->update([
                'status'      => CancelRequest::STATUS_APPROVED,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);

            // Cancelling ends ALL of the student's active subscriptions, so any
            // other pending request for the same student is now moot.
            CancelRequest::where('student_id', $req->student_id)
                ->where('status', CancelRequest::STATUS_PENDING)
                ->update([
                    'status'      => CancelRequest::STATUS_APPROVED,
                    'reviewed_by' => $admin->id,
                    'reviewed_at' => now(),
                    'review_note' => "أُلغي الاشتراك ضمن الطلب #{$req->id}",
                    'updated_at'  => now(),
                ]);

            return null;
        });

        if ($result) return $result;

        return response()->json([
            'message' => 'تم قبول الطلب وإلغاء الاشتراك.',
            'data'    => $this->present($cancellationRequest->fresh()->load($this->relations())),
        ]);
    }

    /** POST /admin/cancellation-requests/{cancellationRequest}/reject */
    public function reject(Request $request, CancelRequest $cancellationRequest): JsonResponse
    {
        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:500'],
        ]);
        $admin = $request->user();

        $result = DB::transaction(function () use ($cancellationRequest, $data, $admin) {
            $req = CancelRequest::whereKey($cancellationRequest->id)->lockForUpdate()->first();

            if (!$req->isPending()) {
                return response()->json(['message' => 'تمت مراجعة هذا الطلب مسبقاً.'], 422);
            }

            $req->update([
                'status'      => CancelRequest::STATUS_REJECTED,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'review_note' => $data['note'] ?? null,
            ]);

            return null;
        });

        if ($result) return $result;

        return response()->json([
            'message' => 'تم رفض الطلب.',
            'data'    => $this->present($cancellationRequest->fresh()->load($this->relations())),
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Shared list filters (staff "الطلبات" page + admin page):
     *   status    pending | approved | rejected | withdrawn
     *   phone     any part of the student's number; "0791…", "791…" and "+962791…" all match
     */
    private function applyFilters($query, Request $request): void
    {
        $request->validate([
            'status'    => ['nullable', 'in:pending,approved,rejected,withdrawn'],
            'phone'     => ['nullable', 'string', 'max:20'],
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('phone')) {
            // Phones are stored as E.164 (+9627…): match on digits in any typed format
            $digits = \App\Support\Phone::searchFragment($request->phone);
            if ($digits !== null) {
                $like = "%{$digits}%";
                $query->whereHas('student', fn ($q) => $q
                    ->whereHas('lead', fn ($l) => $l->where('phone', 'like', $like))
                    ->orWhereHas('user', fn ($u) => $u->where('phone', 'like', $like)));
            }
        }
    }

    private function relations(): array
    {
        return [
            'student.user:id,name,phone',
            'student.lead:id,name,phone',
            'subscription.package:id,name',
            'requestedBy:id,name,role',
            'reviewedBy:id,name',
        ];
    }

    private function paginated($rows): JsonResponse
    {
        return response()->json([
            'data' => collect($rows->items())->map(fn (CancelRequest $r) => $this->present($r)),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page'    => $rows->lastPage(),
                'total'        => $rows->total(),
                'per_page'     => $rows->perPage(),
            ],
        ]);
    }

    private function present(CancelRequest $r): array
    {
        $lead = $r->student?->lead;
        $user = $r->student?->user;
        $sub  = $r->subscription;

        return [
            'id'          => $r->id,
            'status'      => $r->status,
            'reason'      => $r->reason,
            'review_note' => $r->review_note,
            'created_at'  => $r->created_at?->toIso8601String(),
            'reviewed_at' => $r->reviewed_at?->toIso8601String(),
            'student'     => [
                'id'      => $r->student_id,
                'lead_id' => $lead?->id,
                'name'    => $lead?->name ?? $user?->name,
                'phone'   => $lead?->phone ?? $user?->phone,
            ],
            'subscription' => $sub ? [
                'id'            => $sub->id,
                'status'        => $sub->status,
                'package'       => $sub->package?->name,
                'amount_paid'   => (float) $sub->amount_paid,
                'lessons_count' => $sub->lessons_count,
                'months_count'  => $sub->months_count,
                'activated_at'  => $sub->activated_at?->toIso8601String(),
                'expires_at'    => $sub->expires_at?->toIso8601String(),
            ] : null,
            'requested_by' => $r->requestedBy ? [
                'id'   => $r->requestedBy->id,
                'name' => $r->requestedBy->name,
                'role' => $r->requestedBy->role,
            ] : null,
            'reviewed_by' => $r->reviewedBy ? [
                'id'   => $r->reviewedBy->id,
                'name' => $r->reviewedBy->name,
            ] : null,
        ];
    }
}

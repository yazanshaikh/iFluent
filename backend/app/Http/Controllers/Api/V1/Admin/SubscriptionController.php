<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Models\Lead;
use App\Models\Subscription;
use App\Notifications\SubscriptionActivated;
use App\Notifications\SubscriptionRejected;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SubscriptionController extends Controller
{
    /**
     * GET /admin/subscriptions/pending
     * All subscriptions awaiting manager approval.
     */
    public function pending(): AnonymousResourceCollection
    {
        $subscriptions = Subscription::where('status', Subscription::STATUS_PENDING)
            ->with(['student.user', 'paymentAccount', 'activatedBy'])
            ->latest()
            ->paginate(20);

        return SubscriptionResource::collection($subscriptions);
    }

    /**
     * GET /admin/subscriptions
     * Full list with optional status filter.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Subscription::with(['student.user', 'paymentAccount', 'activatedBy', 'approvedBy'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return SubscriptionResource::collection($query->paginate(20));
    }

    /**
     * POST /admin/subscriptions/{subscription}/approve
     * Manager approves → subscription active → student levels unlocked.
     * Audit trail: approved_by + approved_at recorded.  (PRD 5.4.5)
     */
    public function approve(Request $request, Subscription $subscription): SubscriptionResource|JsonResponse
    {
        if (!$subscription->isPending()) {
            return response()->json([
                'message' => "Cannot approve a subscription with status [{$subscription->status}].",
            ], 422);
        }

        // ── Validate lesson range (optional but recommended) ──────────────────
        $validated = $request->validate([
            'from_lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'to_lesson_id'   => ['nullable', 'integer', 'exists:lessons,id'],
        ]);

        DB::transaction(function () use ($request, $subscription, $validated) {

            $fromId = $validated['from_lesson_id'] ?? null;
            $toId   = $validated['to_lesson_id']   ?? null;

            // ── Calculate lessons_count dynamically from the lesson range ─────
            // If both IDs are provided, count = number of lessons between them.
            // Uses DB to count actual lessons in that ID range (accounts for
            // gaps in IDs across units/levels) instead of simple subtraction.
            if ($fromId && $toId) {
                $lessonsCount = \App\Models\Lesson::whereBetween('id', [
                    min($fromId, $toId),
                    max($fromId, $toId),
                ])->count();
            } else {
                // No range specified — keep the original lessons_count
                $lessonsCount = $subscription->lessons_count;
            }

            $subscription->update([
                'status'            => Subscription::STATUS_ACTIVE,
                'approved_by'       => $request->user()->id,
                'approved_at'       => now(),
                'activated_at'      => now(),
                'expires_at'        => now()->addMonths($subscription->months_count),
                'lessons_count'     => $lessonsCount,
                'from_lesson_id'    => $fromId,
                'to_lesson_id'      => $toId,
                'current_lesson_id' => $fromId,
            ]);

            // ── Credit the student's lesson balance (dynamic count) ───────────
            $subscription->student->user->increment('lesson_credits', $lessonsCount);

            // Update lead → subscriber + add remark with subscription details
            $lead = $subscription->student->lead;
            if ($lead) {
                $lead->update([
                    'status'       => Lead::STATUS_SUBSCRIBER,
                    'converted_at' => now(),
                ]);

                // Build remark content with lesson range
                if ($fromId && $toId) {
                    $fromLesson = \App\Models\Lesson::find($fromId);
                    $toLesson   = \App\Models\Lesson::find($toId);
                    $remarkText = "✅ تم الاشتراك — من درس #{$fromId}";
                    if ($fromLesson) $remarkText .= " ({$fromLesson->title})";
                    $remarkText .= " إلى درس #{$toId}";
                    if ($toLesson)   $remarkText .= " ({$toLesson->title})";
                    $remarkText .= " — {$lessonsCount} درس — {$subscription->amount_paid} د.أ";
                } else {
                    $remarkText = "✅ تم الاشتراك — {$lessonsCount} درس — {$subscription->amount_paid} د.أ";
                }

                $lead->remarks()->create([
                    'content'  => $remarkText,
                    'staff_id' => $request->user()->id,
                ]);
            }

            // Notify student
            $subscription->student->user->notify(
                new SubscriptionActivated($subscription)
            );
        });

        return new SubscriptionResource(
            $subscription->fresh()->load(['student.user', 'paymentAccount', 'activatedBy', 'approvedBy'])
        );
    }

    /**
     * POST /admin/subscriptions/{subscription}/reject
     * Manager rejects with optional reason.
     */
    public function reject(Request $request, Subscription $subscription): SubscriptionResource|JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if (!$subscription->isPending()) {
            return response()->json([
                'message' => "Cannot reject a subscription with status [{$subscription->status}].",
            ], 422);
        }

        DB::transaction(function () use ($request, $subscription) {

            $subscription->update([
                'status'      => Subscription::STATUS_CANCELLED,
                'approved_by' => $request->user()->id,  // who took the action
                'approved_at' => now(),
            ]);

            // Notify the CC staff who submitted
            $submission = $subscription->activatedBy;
            $submission?->notify(
                new SubscriptionRejected($subscription, $request->reason)
            );

            // Notify the student too
            $subscription->student->user->notify(
                new SubscriptionRejected($subscription, $request->reason)
            );
        });

        return new SubscriptionResource(
            $subscription->fresh()->load(['student.user', 'paymentAccount', 'activatedBy', 'approvedBy'])
        );
    }

    /**
     * POST /admin/subscriptions/{subscription}/cancel-subscription
     * Admin cancels an active subscription:
     *   - marks subscription as cancelled
     *   - revokes student's remaining lesson_credits
     *   - reverts lead status from subscriber → in_progress
     *   - saves cancellation reason as a lead remark
     */
    public function cancelSubscription(Request $request, Subscription $subscription): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        if (!$subscription->isActive()) {
            return response()->json(['message' => 'الاشتراك غير نشط.'], 422);
        }

        DB::transaction(function () use ($request, $subscription) {
            // 1. Cancel subscription & zero out credits
            $subscription->update(['status' => Subscription::STATUS_CANCELLED]);
            $subscription->student->user->update(['lesson_credits' => 0]);

            // 2. Revert lead status → in_progress (back in pipeline)
            $lead = $subscription->student->lead;
            if ($lead) {
                $lead->update(['status' => Lead::STATUS_IN_PROGRESS]);

                // 3. Save reason as a lead remark
                $lead->remarks()->create([
                    'content'  => '❌ تم إلغاء الاشتراك — السبب: ' . $request->reason,
                    'staff_id' => $request->user()->id,
                ]);
            }
        });

        return response()->json(['message' => 'تم إلغاء الاشتراك بنجاح.']);
    }

    /**
     * GET /admin/subscriptions/{subscription}/screenshot
     * Serve the private payment screenshot securely.
     */
    public function screenshot(Subscription $subscription): \Symfony\Component\HttpFoundation\StreamedResponse|JsonResponse
    {
        if (!$subscription->payment_screenshot) {
            return response()->json(['message' => 'No screenshot available.'], 404);
        }

        if (!Storage::disk('private')->exists($subscription->payment_screenshot)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return Storage::disk('private')->download(
            $subscription->payment_screenshot,
            "payment-{$subscription->id}." . pathinfo($subscription->payment_screenshot, PATHINFO_EXTENSION)
        );
    }
}

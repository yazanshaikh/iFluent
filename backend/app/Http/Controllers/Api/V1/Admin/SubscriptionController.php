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

            $subscription->update([
                'status'            => Subscription::STATUS_ACTIVE,
                'approved_by'       => $request->user()->id,
                'approved_at'       => now(),
                'activated_at'      => now(),
                'expires_at'        => now()->addMonths($subscription->months_count),
                // Lesson range — current starts at the first lesson
                'from_lesson_id'    => $fromId,
                'to_lesson_id'      => $toId,
                'current_lesson_id' => $fromId, // pointer starts at the beginning
            ]);

            // ── Credit the student's lesson balance ───────────────────────────
            $subscription->student->user->increment('lesson_credits', $subscription->lessons_count);

            // Update lead → subscriber
            $lead = $subscription->student->lead;
            if ($lead) {
                $lead->update([
                    'status'       => Lead::STATUS_SUBSCRIBER,
                    'converted_at' => now(),
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

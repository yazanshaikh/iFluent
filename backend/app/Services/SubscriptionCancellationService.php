<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * The one place that actually cancels a student's subscription.
 * Used by the admin "cancel subscription" button and by approving a
 * staff cancellation request.
 */
class SubscriptionCancellationService
{
    /**
     *   - marks ALL of the student's active subscriptions as cancelled
     *   - zeroes the student's lesson_credits
     *   - reverts lead status → no_answer
     *   - saves the reason as a lead remark (authored by $by)
     */
    public function cancel(Subscription $subscription, User $by, string $reason): void
    {
        DB::transaction(function () use ($subscription, $by, $reason) {
            $student = $subscription->student()->with('user')->first();

            // 1. Cancel ALL active subscriptions for this student (not just the clicked one)
            Subscription::where('student_id', $student->id)
                ->where('status', Subscription::STATUS_ACTIVE)
                ->update(['status' => Subscription::STATUS_CANCELLED]);

            // 2. Zero out ALL lesson credits — direct DB query to avoid cache issues
            DB::table('users')
                ->where('id', $student->user_id)
                ->update(['lesson_credits' => 0]);

            // 3. Revert lead status → no_answer (back in pipeline)
            $lead = $student->lead;
            if ($lead) {
                $lead->update(['status' => Lead::STATUS_NO_ANSWER]);

                // 4. Save reason as a lead remark
                $lead->remarks()->create([
                    'content'  => '❌ تم إلغاء الاشتراك — السبب: ' . $reason,
                    'staff_id' => $by->id,
                ]);
            }
        });
    }
}

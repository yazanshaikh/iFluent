<?php

namespace App\Services;

use App\Models\Session;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

/**
 * Awards the "student subscribed" point. Called when an admin approves a
 * subscription; only the student's FIRST approved subscription earns one.
 */
class TeacherConversionService
{
    public function awardForApprovedSubscription(Subscription $subscription): void
    {
        $student = $subscription->student;

        // Renewal → no point. Rejected invoices were never activated, so they don't count.
        $hadEarlierSubscription = Subscription::where('student_id', $student->id)
            ->where('id', '!=', $subscription->id)
            ->whereNotNull('activated_at')
            ->exists();

        if ($hadEarlierSubscription) {
            return;
        }

        // A trial may be linked by the student's account, or only by the lead
        // when it was booked before the student had an account.
        $lastTrial = Session::query()
            ->where('status', Session::STATUS_COMPLETED)
            ->where('attendance_status', Session::ATTENDANCE_ATTENDED)
            ->whereNotNull('teacher_id')
            ->whereHas('lesson', fn ($q) => $q->where('is_assessment', true))
            ->where(function ($q) use ($student) {
                $q->where('student_id', $student->user_id);
                if ($student->lead_id) {
                    $q->orWhere('lead_id', $student->lead_id);
                }
            })
            ->orderByDesc('ended_at')
            ->orderByDesc('id')
            ->first();

        if (!$lastTrial) {
            return;
        }

        // UNIQUE(student_id): even a concurrent approval can't award a second point.
        DB::table('teacher_conversion_points')->insertOrIgnore([
            'teacher_id'      => $lastTrial->teacher_id,
            'student_id'      => $student->id,
            'subscription_id' => $subscription->id,
            'session_id'      => $lastTrial->id,
            'awarded_at'      => now(),
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
    }
}

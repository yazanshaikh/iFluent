<?php

namespace App\Services;

use App\Models\Session;
use Illuminate\Support\Facades\Log;

class SessionAttendanceService
{
    /**
     * Determine attendance status based on who was actually present
     *
     * Rules:
     * 1. If teacher not present → teacher_absent (always)
     * 2. If teacher present + student present → attended ✅
     * 3. If teacher present + student not present → absent ❌
     */
    public static function determineAttendanceStatus(Session $session): string
    {
        // ❌ Rule 1: Teacher didn't show up = teacher_absent
        if (!$session->teacher_present) {
            return 'teacher_absent';
        }

        // ❌ Rule 2: Student didn't join at all
        if (!$session->student_present) {
            return 'absent';
        }

        // ✅ Rule 3: Both present — check 10 minute minimum
        // attended = both joined AND student stayed 10+ minutes
        $studentJoinedAt = $session->student_joined_at;
        $endedAt         = $session->ended_at ?? now();

        if ($studentJoinedAt) {
            $minutesInSession = $studentJoinedAt->diffInMinutes($endedAt);
            if ($minutesInSession >= Session::MIN_SESSION_MINUTES) {
                return 'attended';
            }
        }

        // Student joined but left too early
        return 'absent';
    }

    /**
     * Calculate balance deduction based on attendance
     *
     * Rules:
     * - Student absent: Deduct 1 session from student balance
     * - Teacher absent: Don't deduct from student (teacher is responsible)
     * - Both attended: No deduction
     */
    public static function calculateBalanceImpact(Session $session): array
    {
        $attendanceStatus = self::determineAttendanceStatus($session);

        return match ($attendanceStatus) {
            'attended' => [
                'deduct_from_student' => false,
                'reason' => 'Both attended - normal payment',
            ],
            'absent' => [
                'deduct_from_student' => true,  // ← Student wasted a booking
                'reason' => 'Student absent - charge student',
            ],
            'teacher_absent' => [
                'deduct_from_student' => false,  // ← Don't charge student
                'reason' => 'Teacher absent - don\'t charge student',
            ],
        };
    }

    /**
     * Handle ALL expired sessions — called every 5 minutes by scheduler.
     *
     * Covers 3 scenarios:
     *
     * ① waiting → teacher_absent
     *    Condition: status=waiting AND scheduled_at + 15min grace has passed
     *    Reason: Teacher never started the session
     *    Action: complete with teacher_absent, NO deduction from student
     *
     * ② active → teacher_absent OR absent
     *    Condition: status=active AND started_at > 1 hour ago
     *    Reason: Session stuck open (teacher never clicked End)
     *    Action: complete using presence flags
     *
     * ③ waiting (SessionRequest) → expired
     *    Condition: SessionRequest pending/confirmed AND requested_at_utc + 15min passed
     *    Reason: No teacher accepted in time
     *    Action: mark SessionRequest as expired (not Session, it's still waiting)
     */
    public static function handleAutoExpiry(): void
    {
        $now = now();

        // ─── ① Waiting sessions past grace period (teacher never started) ──────
        $expiredWaiting = Session::where('status', Session::STATUS_WAITING)
            ->where('scheduled_at', '<', $now->copy()->subMinutes(15))
            ->get();

        foreach ($expiredWaiting as $session) {
            $session->update([
                'status'            => Session::STATUS_COMPLETED,
                'ended_at'          => $now,
                'attendance_status' => Session::ATTENDANCE_TEACHER_ABSENT,
            ]);

            // Refund credit — teacher never showed up
            if ($session->student_id) {
                $session->student->increment('lesson_credits');
            }

            // Update linked SessionRequest timestamp for CRM 24h window
            \App\Models\SessionRequest::where('session_id', $session->id)
                ->update(['updated_at' => $now]);

            // Broadcast to student
            try {
                broadcast(new \App\Events\SessionEnded($session, Session::ATTENDANCE_TEACHER_ABSENT));
            } catch (\Throwable) {}

            Log::info("[AutoExpiry] waiting→teacher_absent", [
                'session_id'   => $session->id,
                'scheduled_at' => $session->scheduled_at,
                'teacher_id'   => $session->teacher_id,
                'student_id'   => $session->student_id,
            ]);
        }

        // ─── ② Active sessions past their scheduled end time + 15min grace ───
        // Session scheduled at T, expected to last ~1 hour.
        // Auto-close if: started_at < (now - 1 hour) OR scheduled_at < (now - 1h15min)
        $expiredActive = Session::where('status', Session::STATUS_ACTIVE)
            ->where(function ($q) use ($now) {
                $q->where('started_at', '<', $now->copy()->subHour())      // started > 1 hour ago
                  ->orWhere('scheduled_at', '<', $now->copy()->subMinutes(75)); // scheduled > 1h15m ago
            })
            ->get();

        foreach ($expiredActive as $session) {
            $attendance = self::determineAttendanceStatus($session);

            $session->update([
                'status'            => Session::STATUS_COMPLETED,
                'ended_at'          => $now,
                'attendance_status' => $attendance,
            ]);

            // Refund credit if teacher absent
            if ($attendance === Session::ATTENDANCE_TEACHER_ABSENT && $session->student_id) {
                $session->student->increment('lesson_credits');
            }

            // Update linked SessionRequest timestamp for CRM
            \App\Models\SessionRequest::where('session_id', $session->id)
                ->update(['updated_at' => $now]);

            // Broadcast to student so their app updates immediately
            try {
                broadcast(new \App\Events\SessionEnded($session, $attendance));
            } catch (\Throwable) {}

            Log::info("[AutoExpiry] active→{$attendance}", [
                'session_id'      => $session->id,
                'started_at'      => $session->started_at,
                'teacher_present' => $session->teacher_present,
                'student_present' => $session->student_present,
            ]);
        }

        // ─── ③ Orphan SessionRequests past their time → expired ──────────────
        // pending/confirmed requests where requested_at_utc + 15min grace passed
        // and still no linked session (or session already completed)
        $expiredRequests = \App\Models\SessionRequest::whereIn('status', [
                \App\Models\SessionRequest::STATUS_PENDING,
                \App\Models\SessionRequest::STATUS_CONFIRMED,
            ])
            ->where('requested_at_utc', '<', $now->copy()->subMinutes(15))
            ->get();

        foreach ($expiredRequests as $request) {
            $request->update(['status' => \App\Models\SessionRequest::STATUS_EXPIRED]);
            Log::info("[AutoExpiry] SessionRequest expired", [
                'request_id'       => $request->id,
                'requested_at_utc' => $request->requested_at_utc,
                'old_status'       => $request->getOriginal('status'),
            ]);
        }

        $total = $expiredWaiting->count() + $expiredActive->count();
        if ($total > 0) {
            Log::info("[AutoExpiry] Done: {$expiredWaiting->count()} waiting + {$expiredActive->count()} active expired");
        }
    }

    /**
     * Mark teacher as present when they enter the video room
     */
    public static function markTeacherPresent(Session $session): void
    {
        $session->update([
            'teacher_present' => true,
            'teacher_started_at' => now(),
        ]);

        Log::info("Teacher marked present", [
            'session_id' => $session->id,
            'teacher_id' => $session->teacher_id,
        ]);
    }

    /**
     * Mark student as present when they enter the video room
     */
    public static function markStudentPresent(Session $session): void
    {
        $session->update([
            'student_present' => true,
        ]);

        Log::info("Student marked present", [
            'session_id' => $session->id,
            'student_id' => $session->student_id,
        ]);
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Session;
use Illuminate\Console\Command;

/**
 * Auto-expire sessions that were never started or where student didn't attend.
 *
 * Rules (run every 5 minutes):
 *  1. waiting  + scheduled_at < now-30min → completed / teacher_absent
 *     (teacher accepted but never pressed Start)
 *
 *  2. active + student_joined_at IS NULL + started_at < now-60min
 *     → completed / absent
 *     (teacher started but student never joined within 1 hour)
 *
 *  3. Sessions stay in DB forever (needed for running totals).
 *     They disappear from teacher/student list views via API filter (ended_at < now-24h).
 */
class ExpireSessionsCommand extends Command
{
    protected $signature   = 'crm:expire-sessions';
    protected $description = 'Auto-complete stale sessions and purge old records after 24 hours.';

    public function handle(): int
    {
        // ── 1. Waiting sessions whose time passed (teacher didn't start) ──────
        $teacherAbsent = Session::where('status', Session::STATUS_WAITING)
            ->where('scheduled_at', '<', now()->subMinutes(30))
            ->update([
                'status'            => Session::STATUS_COMPLETED,
                'attendance_status' => Session::ATTENDANCE_TEACHER_ABSENT,
                'ended_at'          => now(),
            ]);

        // ── 2. Active sessions where student never joined within 1 hour ───────
        $studentAbsent = Session::where('status', Session::STATUS_ACTIVE)
            ->whereNull('student_joined_at')
            ->where('started_at', '<', now()->subHour())
            ->update([
                'status'            => Session::STATUS_COMPLETED,
                'attendance_status' => Session::ATTENDANCE_ABSENT,
                'ended_at'          => now(),
            ]);

        $this->info("✓ teacher_absent={$teacherAbsent}  student_absent={$studentAbsent}");

        return self::SUCCESS;
    }
}

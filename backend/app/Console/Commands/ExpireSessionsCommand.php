<?php

namespace App\Console\Commands;

use App\Models\Session;
use App\Models\SessionRequest;
use App\Services\SessionAttendanceService;
use Illuminate\Console\Command;

/**
 * Auto-expire sessions and requests that timed out (runs every 5 minutes).
 *
 * Rules:
 *  ① SessionRequest pending/confirmed + requested_at_utc passed → expired
 *     (nobody accepted the request in time → "لم يقبل أي معلم")
 *
 *  ② Session waiting + scheduled_at < now-15min → teacher_absent
 *     (teacher accepted but never pressed Start)
 *
 *  ③ Session active + started_at < now-1hr OR scheduled_at < now-1h15m → classify
 *     (session stuck open — classify based on actual presence flags)
 */
class ExpireSessionsCommand extends Command
{
    protected $signature   = 'crm:expire-sessions';
    protected $description = 'Auto-expire timed-out sessions and requests.';

    public function handle(): int
    {
        $now = now();

        // ── ① SessionRequests that nobody accepted ────────────────────────────
        $expiredRequests = SessionRequest::whereIn('status', [
                SessionRequest::STATUS_PENDING,
                SessionRequest::STATUS_CONFIRMED,
            ])
            ->where('requested_at_utc', '<', $now->copy()->subMinutes(15))
            ->get();

        foreach ($expiredRequests as $req) {
            $req->update(['status' => SessionRequest::STATUS_EXPIRED]);
        }

        // ── ② Waiting sessions past grace period ─────────────────────────────
        $waitingSessions = Session::where('status', Session::STATUS_WAITING)
            ->where('scheduled_at', '<', $now->copy()->subMinutes(15))
            ->get();

        foreach ($waitingSessions as $session) {
            $session->update([
                'status'            => Session::STATUS_COMPLETED,
                'attendance_status' => Session::ATTENDANCE_TEACHER_ABSENT,
                'ended_at'          => $now,
            ]);
            SessionRequest::where('session_id', $session->id)->update(['updated_at' => $now]);

            // Refund credit — teacher never showed up
            if ($session->student_id) {
                $session->student->increment('lesson_credits');
            }

            try { broadcast(new \App\Events\SessionEnded($session, Session::ATTENDANCE_TEACHER_ABSENT)); } catch (\Throwable) {}
        }

        // ── ③ Active sessions past their time ────────────────────────────────
        $activeSessions = Session::where('status', Session::STATUS_ACTIVE)
            ->where(function ($q) use ($now) {
                $q->where('started_at', '<', $now->copy()->subHour())
                  ->orWhere('scheduled_at', '<', $now->copy()->subMinutes(75));
            })
            ->get();

        foreach ($activeSessions as $session) {
            $attendance = SessionAttendanceService::determineAttendanceStatus($session);
            $session->update([
                'status'            => Session::STATUS_COMPLETED,
                'attendance_status' => $attendance,
                'ended_at'          => $now,
            ]);
            SessionRequest::where('session_id', $session->id)->update(['updated_at' => $now]);

            // Refund credit if teacher absent (credit was deducted at booking time)
            if ($attendance === Session::ATTENDANCE_TEACHER_ABSENT && $session->student_id) {
                $session->student->increment('lesson_credits');
            }

            try { broadcast(new \App\Events\SessionEnded($session, $attendance)); } catch (\Throwable) {}
        }

        $this->info("✓ requests_expired={$expiredRequests->count()} waiting_expired={$waitingSessions->count()} active_expired={$activeSessions->count()}");

        return self::SUCCESS;
    }
}

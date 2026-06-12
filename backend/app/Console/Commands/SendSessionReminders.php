<?php

namespace App\Console\Commands;

use App\Models\Session;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Console\Command;

/**
 * Push a reminder to the student ~10 minutes before a booked session starts.
 * Runs every minute. Each session is reminded once (reminder_sent_at guard).
 */
class SendSessionReminders extends Command
{
    protected $signature   = 'crm:session-reminders';
    protected $description = 'Send a push reminder ~10 min before each upcoming session.';

    public function handle(FcmService $fcm): int
    {
        $now = now();

        $sessions = Session::where('status', Session::STATUS_WAITING)
            ->whereNull('reminder_sent_at')
            ->whereNotNull('scheduled_at')
            ->whereBetween('scheduled_at', [$now, $now->copy()->addMinutes(10)])
            ->get();

        foreach ($sessions as $session) {
            $student = User::find($session->student_id);

            // Always stamp so we don't retry every minute (even if no token).
            $session->update(['reminder_sent_at' => $now]);

            if ($student && $student->fcm_token) {
                $fcm->sessionReminder(
                    $student,
                    $session->id,
                    optional($session->scheduled_at)->toIso8601String() ?? '',
                );
            }
        }

        if ($sessions->isNotEmpty()) {
            $this->info("Sent {$sessions->count()} session reminder(s).");
        }

        return self::SUCCESS;
    }
}

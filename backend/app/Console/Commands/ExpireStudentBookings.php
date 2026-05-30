<?php

namespace App\Console\Commands;

use App\Models\SessionRequest;
use Illuminate\Console\Command;

/**
 * Marks student session requests as 'expired' when:
 *   - status is still 'pending' or 'confirmed'
 *   - the scheduled time (requested_at_utc) has passed by more than 30 minutes
 *     (grace period — teacher may be slightly late)
 *   - no session was ever created (session_id is null)
 *
 * Runs every 15 minutes via the scheduler.
 */
class ExpireStudentBookings extends Command
{
    protected $signature   = 'crm:expire-student-bookings';
    protected $description = 'Expire student session requests whose scheduled time has passed with no teacher response.';

    public function handle(): int
    {
        $cutoff = now()->subMinutes(30);

        $expired = SessionRequest::whereIn('type', [
                SessionRequest::TYPE_CORE,
                SessionRequest::TYPE_PRIVATE,
            ])
            ->whereIn('status', [
                SessionRequest::STATUS_PENDING,
                SessionRequest::STATUS_CONFIRMED,
            ])
            ->whereNull('session_id')
            ->where('requested_at_utc', '<', $cutoff)
            ->update(['status' => SessionRequest::STATUS_EXPIRED]);

        $this->info("✓ Expired {$expired} student booking request(s) past their scheduled time.");

        return self::SUCCESS;
    }
}

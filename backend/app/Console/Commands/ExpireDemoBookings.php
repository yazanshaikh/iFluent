<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\SessionRequest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireDemoBookings extends Command
{
    protected $signature   = 'crm:expire-demo-bookings';
    protected $description = 'Expire past-due pending demo bookings and move their leads to Lead Pool after 2 days.';

    public function handle(): int
    {
        // ── Step 1: Mark pending bookings whose scheduled time has passed as expired ──
        $expired = SessionRequest::where('type', SessionRequest::TYPE_DEMO)
            ->where('status', SessionRequest::STATUS_PENDING)
            ->where('requested_at_utc', '<', now())
            ->update(['status' => SessionRequest::STATUS_EXPIRED]);

        $this->info("✓ Expired {$expired} past-due pending demo booking(s).");

        // ── Step 2: Move leads to Lead Pool if booking was completed 2+ days ago ──
        //
        // Rules:
        //   - Booking status: expired | confirmed | cancelled | rejected
        //   - updated_at < now() - 2 days  (booking is at least 2 days old)
        //   - Lead status is still 'new'   (hasn't been manually reclassified by staff)
        //   - Lead has an assigned employee (not in admin pool)
        //
        $oldBookingLeadIds = SessionRequest::where('type', SessionRequest::TYPE_DEMO)
            ->whereIn('status', [
                SessionRequest::STATUS_EXPIRED,
                SessionRequest::STATUS_CONFIRMED,
                SessionRequest::STATUS_CANCELLED,
                SessionRequest::STATUS_REJECTED,
            ])
            ->where('updated_at', '<', now()->subDays(2))
            ->whereNotNull('lead_id')
            ->pluck('lead_id')
            ->unique();

        $moved = 0;

        if ($oldBookingLeadIds->isNotEmpty()) {
            $moved = Lead::whereIn('id', $oldBookingLeadIds)
                ->where('status', Lead::STATUS_NEW)
                ->whereNotNull('assigned_to')
                ->update(['status' => Lead::STATUS_IN_PROGRESS]);
        }

        $this->info("✓ Moved {$moved} lead(s) from New Leads to Lead Pool.");

        return self::SUCCESS;
    }
}

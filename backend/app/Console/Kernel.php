<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Auto-expiry runs via the `crm:expire-sessions` command, scheduled in
        // routes/console.php. It used to ALSO run here as a duplicate closure —
        // both fired every 5 min on the same tick and double-refunded credits
        // (student ended up with MORE credits than they started). Removed.
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

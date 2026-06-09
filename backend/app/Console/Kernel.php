<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Services\SessionAttendanceService;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // ⚠️ CRITICAL: Auto-expire sessions every 5 minutes
        // Ends any active session that has been running for > 1 hour
        $schedule->call(function () {
            SessionAttendanceService::handleAutoExpiry();
        })->everyFiveMinutes()
          ->withoutOverlapping()
          ->runInBackground();
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

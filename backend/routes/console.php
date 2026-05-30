<?php

use App\Console\Commands\ExpireDemoBookings;
use App\Console\Commands\ExpireStudentBookings;
use App\Console\Commands\MoveLeadsToOpenSea;
use Illuminate\Support\Facades\Schedule;

// Expire past-due demo bookings + move ready leads to Lead Pool — every hour
Schedule::command(ExpireDemoBookings::class)->hourly();

// Expire student session requests 30 min after scheduled time with no teacher — every 15 min
Schedule::command(ExpireStudentBookings::class)->everyFifteenMinutes();

// Move stale leads (5 days with no action) to Open Sea — midnight Jordan time (UTC+3 = 21:00 UTC)
Schedule::command(MoveLeadsToOpenSea::class)->dailyAt('21:00');

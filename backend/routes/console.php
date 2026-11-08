<?php

use App\Console\Commands\ExpireDemoBookings;
use App\Console\Commands\ExpireSessionsCommand;
use App\Console\Commands\ExpireStudentBookings;
use App\Console\Commands\ExpireSubscriptions;
use App\Console\Commands\SendSessionReminders;
use Illuminate\Support\Facades\Schedule;

// Expire past-due demo bookings + move ready leads to Lead Pool — every hour
Schedule::command(ExpireDemoBookings::class)->hourly();

// Expire student session requests 30 min after scheduled time with no teacher — every 15 min
Schedule::command(ExpireStudentBookings::class)->everyFifteenMinutes();

// Auto-complete stale sessions + purge records older than 24h — every 5 min
Schedule::command(ExpireSessionsCommand::class)->everyFiveMinutes();

// Stale leads (5 days with no action) are NO LONGER moved to the Open Sea
// automatically — they get a red "ترحيل" flag in the CRM and staff confirm the
// move (LeadController::moveToSea). The ifluent:open-sea command still exists
// for a manual bulk run but is not scheduled.

// Expire subscriptions past their end date with no lessons left — hourly
Schedule::command(ExpireSubscriptions::class)->hourly();

// Send push reminder ~10 min before each session — every minute
Schedule::command(SendSessionReminders::class)->everyMinute();

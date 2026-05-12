<?php

use App\Console\Commands\MoveLeadsToOpenSea;
use Illuminate\Support\Facades\Schedule;

// Runs every day at midnight Jordan time (UTC+3 = 21:00 UTC)
Schedule::command(MoveLeadsToOpenSea::class)->dailyAt('21:00');

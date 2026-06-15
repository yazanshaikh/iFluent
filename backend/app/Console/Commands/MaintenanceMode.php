<?php

namespace App\Console\Commands;

use App\Models\SiteSetting;
use Illuminate\Console\Command;

/**
 * Toggle the in-app maintenance screen for the mobile apps.
 *
 *   php artisan ifluent:maintenance on  --message="..."
 *   php artisan ifluent:maintenance off
 *
 * This does NOT stop the backend (unlike `php artisan down`) — the API keeps
 * serving so the apps can read the flag and show a friendly maintenance screen.
 */
class MaintenanceMode extends Command
{
    protected $signature = 'ifluent:maintenance {state : on or off} {--message= : Optional message shown to users}';

    protected $description = 'Turn the mobile apps maintenance screen on or off.';

    public function handle(): int
    {
        $state = strtolower((string) $this->argument('state'));

        if (! in_array($state, ['on', 'off'], true)) {
            $this->error('State must be "on" or "off".');
            return self::FAILURE;
        }

        $on = $state === 'on';
        SiteSetting::set('maintenance_mode', $on);

        if ($message = $this->option('message')) {
            SiteSetting::set('maintenance_message', $message);
        }

        $this->info($on
            ? 'Maintenance mode is now ON — apps will show the maintenance screen.'
            : 'Maintenance mode is now OFF — apps are live again.');

        return self::SUCCESS;
    }
}

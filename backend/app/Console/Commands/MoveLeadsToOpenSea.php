<?php

namespace App\Console\Commands;

use App\Models\Lead;
use Illuminate\Console\Command;

class MoveLeadsToOpenSea extends Command
{
    protected $signature   = 'ifluent:open-sea';
    protected $description = 'Move stale leads (no conversion in 5 days) to Open Sea — skips Small Treasure.';

    public function handle(): int
    {
        // PRD 5.2: Lead with no conversion after 5 days → Open Sea
        // Exception: is_small_treasure = true → stays with staff
        // is_small_treasure = true  → محمية، ما تنتقل أبداً (PRD 5.3)
        // is_small_treasure = false → تنتقل بعد 5 أيام
        // is_small_treasure = NULL  → نعاملها كـ false (أمان إضافي)
        $moved = Lead::query()
            ->whereIn('status', [Lead::STATUS_ASSIGNED, Lead::STATUS_WORKING])
            ->where(fn($q) => $q->where('is_small_treasure', false)
                                ->orWhereNull('is_small_treasure'))
            ->where('updated_at', '<=', now()->subDays(5))
            ->update([
                'status'               => Lead::STATUS_OPEN_SEA,
                'assigned_to'          => null,
                'moved_to_open_sea_at' => now(),
            ]);

        $this->info("✓ Moved {$moved} lead(s) to Open Sea.");

        return self::SUCCESS;
    }
}

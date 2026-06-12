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
        // الحالات التي تندرج في Lead Pool (يعمل عليها الموظف).
        // 'new' مُضمَّنة: تعيين الليدة يُبقي حالتها 'new' حتى يصنّفها الموظف،
        // فالليدة المُعيَّنة التي بقيت 'new' دون عمل 5 أيام = مهملة → للبحر المفتوح.
        // (الليدات الجديدة غير المعيَّنة محميّة بشرط assigned_to NOT NULL أدناه.)
        $poolStatuses = [
            Lead::STATUS_NEW,
            Lead::STATUS_IN_PROGRESS,
            Lead::STATUS_INTERESTED,
            Lead::STATUS_NOT_INTERESTED,
            Lead::STATUS_POSTPONED,
        ];

        $moved = Lead::query()
            ->whereIn('status', $poolStatuses)
            ->where('status', '!=', Lead::STATUS_SUBSCRIBER) // المشترك لا يذهب للبحر أبداً
            ->where(fn($q) => $q->where('is_small_treasure', false)
                                ->orWhereNull('is_small_treasure'))
            ->whereNotNull('assigned_to')   // لا تنقل الليدات غير المعيّنة
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

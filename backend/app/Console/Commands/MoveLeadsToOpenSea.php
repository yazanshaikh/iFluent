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
        // PRD 5.2: أي ليد راكدة 5 أيام بدون تحويل → البحر المفتوح (Open Sea).
        // القاعدة (مُتّفق عليها): الليد اللي مش بالـ Small Treasury، وراكدة +5 أيام،
        // وحالتها مش "مشترك" → تنتقل للبحر المفتوح — سواء كانت مُسندة أو لأ.
        // الاستثناء الوحيد: is_small_treasure = true → محمية، ما تنتقل أبداً (PRD 5.3).
        // is_small_treasure = NULL نعاملها كـ false (أمان إضافي).
        // ملاحظة: شرط "غير مُسندة محميّة" أُزيل عمداً — الليدات الراكدة غير المُسندة
        // (بما فيها الجديدة غير المُوزَّعة) كانت تعلق للأبد دون أن تصل البحر المفتوح.
        $poolStatuses = [
            Lead::STATUS_NEW,
            Lead::STATUS_NO_ANSWER,
            Lead::STATUS_INTERESTED,
            Lead::STATUS_NOT_INTERESTED,
            Lead::STATUS_POSTPONED,
        ];

        $moved = Lead::query()
            ->whereIn('status', $poolStatuses)
            ->where('status', '!=', Lead::STATUS_SUBSCRIBER) // المشترك لا يذهب للبحر أبداً
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

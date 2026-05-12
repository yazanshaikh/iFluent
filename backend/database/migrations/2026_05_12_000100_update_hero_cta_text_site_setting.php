<?php

use App\Models\SiteSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $legacy = ['ابدأ رحلتك الآن', 'ابدأ رحلتك الان', 'ابدأ رحلتك الأن'];
        $new    = 'احجز حصة تقييم مستوى مجانية';

        $row = SiteSetting::query()->where('key', 'hero_cta_text')->first();
        if (! $row) {
            return;
        }
        $val = $row->value;
        if (is_string($val) && in_array($val, $legacy, true)) {
            $row->update(['value' => $new]);
        }
    }

    public function down(): void
    {
        // Intentionally empty — do not restore marketing copy
    }
};

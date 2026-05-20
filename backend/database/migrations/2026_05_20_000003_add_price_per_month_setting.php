<?php

use App\Models\SiteSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        SiteSetting::firstOrCreate(
            ['key' => 'price_per_month'],
            [
                'value' => 50,
                'type'  => 'number',
                'label' => 'سعر الشهر الواحد (دينار)',
                'group' => 'pricing',
            ]
        );
    }

    public function down(): void
    {
        SiteSetting::where('key', 'price_per_month')->delete();
    }
};

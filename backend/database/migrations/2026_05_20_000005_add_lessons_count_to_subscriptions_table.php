<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->unsignedSmallInteger('lessons_count')->nullable()->after('months_count');
        });

        // Backfill: derive lessons_count from months_count for existing rows
        DB::statement('UPDATE subscriptions SET lessons_count = months_count * 12 WHERE lessons_count IS NULL');

        // Rename price_per_month → price_per_lesson in site_settings
        DB::table('site_settings')
            ->where('key', 'price_per_month')
            ->update([
                'key'   => 'price_per_lesson',
                'value' => '5',          // 5 JD per lesson (admin can update)
            ]);
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('lessons_count');
        });

        DB::table('site_settings')
            ->where('key', 'price_per_lesson')
            ->update(['key' => 'price_per_month', 'value' => '50']);
    }
};

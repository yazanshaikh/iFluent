<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add is_assessment flag to lessons.
     *
     * Assessment lessons (is_assessment = true):
     *   - 5 total, one per level
     *   - Do NOT belong to any unit (unit_id = null)
     *   - Can ONLY be scheduled for students with NO active subscription
     *   - Stored in the same lessons table for simplicity
     *   - Fetched separately via ?is_assessment=true filter
     */
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            // unit_id becomes nullable — assessment lessons have no unit
            $table->foreignId('unit_id')->nullable()->change();

            // The flag
            $table->boolean('is_assessment')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('is_assessment');
            $table->foreignId('unit_id')->nullable(false)->change();
        });
    }
};

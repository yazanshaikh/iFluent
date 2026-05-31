<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds lesson-range tracking to subscriptions.
 *
 * from_lesson_id   — first lesson in the package  (set at activation)
 * to_lesson_id     — last  lesson in the package  (set at activation)
 * current_lesson_id — pointer to the next lesson to book (advances after each completed session)
 *
 * All three are nullable so existing subscriptions are not broken.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->foreignId('from_lesson_id')
                  ->nullable()->after('lessons_count')
                  ->constrained('lessons')->nullOnDelete();

            $table->foreignId('to_lesson_id')
                  ->nullable()->after('from_lesson_id')
                  ->constrained('lessons')->nullOnDelete();

            $table->foreignId('current_lesson_id')
                  ->nullable()->after('to_lesson_id')
                  ->constrained('lessons')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropForeign(['from_lesson_id']);
            $table->dropForeign(['to_lesson_id']);
            $table->dropForeign(['current_lesson_id']);
            $table->dropColumn(['from_lesson_id', 'to_lesson_id', 'current_lesson_id']);
        });
    }
};

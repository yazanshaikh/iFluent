<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds attendance_status to sessions.
 *
 * attended      — student was present → advance lesson + deduct credit
 * absent        — student was absent  → deduct credit only (lesson stays)
 * teacher_absent — teacher was absent → nothing changes (refund effectively)
 *
 * Nullable: only set when teacher calls /end.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->enum('attendance_status', [
                'attended',
                'absent',
                'teacher_absent',
            ])->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn('attendance_status');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add lesson_credits balance to users (students).
 * Incremented by CRM staff, decremented on each lesson booking.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Current bookable lesson balance (deducted on booking)
            $table->unsignedInteger('lesson_credits')->default(0)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('lesson_credits');
        });
    }
};

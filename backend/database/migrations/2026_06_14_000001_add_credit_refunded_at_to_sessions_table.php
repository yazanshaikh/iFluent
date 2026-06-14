<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guard against double-refunding a lesson credit.
 *
 * A credit is deducted at booking. It is refunded once when the teacher is
 * absent. Several code paths (auto-expiry command, manual teacher-end) could
 * each issue that refund, and two schedulers used to race → the student ended
 * up with MORE credits than they started with. This timestamp lets every path
 * atomically claim "I already refunded this session" so it happens exactly once.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->timestamp('credit_refunded_at')->nullable()->after('ended_at');
        });
    }

    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn('credit_refunded_at');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Trial/assessment sessions can belong to a LEAD who has no student account
 * yet (landing-page / CRM demo). Two changes make that first-class:
 *
 *   1. sessions.student_id was NOT NULL → accepting a lead-only demo threw a
 *      NOT NULL violation. Make it nullable.
 *   2. Add sessions.lead_id so the session stays linked to the lead, letting the
 *      (not-yet-subscribed) student find and join it by their phone.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->foreignId('lead_id')->nullable()->after('student_id')
                  ->constrained('leads')->nullOnDelete();
        });

        // Relax the NOT NULL without touching the existing FK (Postgres).
        DB::statement('ALTER TABLE sessions ALTER COLUMN student_id DROP NOT NULL');
    }

    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lead_id');
        });

        // Only re-add NOT NULL if no null rows exist (best-effort).
        if (! DB::table('sessions')->whereNull('student_id')->exists()) {
            DB::statement('ALTER TABLE sessions ALTER COLUMN student_id SET NOT NULL');
        }
    }
};

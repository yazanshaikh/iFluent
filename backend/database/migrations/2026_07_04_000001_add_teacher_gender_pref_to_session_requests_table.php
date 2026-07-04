<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * teacher_gender_pref has been written by the booking flow (and read by the
 * teacher requests list) for a while, but no migration ever added the column —
 * it only existed on hand-patched dev databases. A clean production migrate
 * therefore lacked it → "column teacher_gender_pref does not exist" (500) on
 * every booking. Add the nullable string ('male' | 'female' | null).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('session_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('session_requests', 'teacher_gender_pref')) {
                $table->string('teacher_gender_pref', 10)->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('session_requests', function (Blueprint $table) {
            if (Schema::hasColumn('session_requests', 'teacher_gender_pref')) {
                $table->dropColumn('teacher_gender_pref');
            }
        });
    }
};

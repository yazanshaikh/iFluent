<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Track when each participant actually enters the session.
     *
     * teacher_joined_at = set when teacher calls /start (creates Daily room)
     * student_joined_at = set when student calls /join successfully
     *
     * Commission rule: only credited if BOTH joined AND session ran ≥ 10 minutes
     * (from the moment the student joined until session ended)
     */
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->timestamp('student_joined_at')->nullable()->after('started_at');
            // teacher_joined_at is effectively the same as started_at
            // We add it explicitly for clarity and future flexibility
            $table->timestamp('teacher_joined_at')->nullable()->after('student_joined_at');
        });
    }

    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn(['student_joined_at', 'teacher_joined_at']);
        });
    }
};

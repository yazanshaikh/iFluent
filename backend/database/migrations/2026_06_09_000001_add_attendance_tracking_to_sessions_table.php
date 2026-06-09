<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            // Track if teacher actually joined the video room
            $table->boolean('teacher_present')->default(false)->after('attendance_status');

            // Track if student actually joined the video room
            $table->boolean('student_present')->default(false)->after('teacher_present');

            // When teacher actually started (not just clicked button, but entered room)
            $table->timestamp('teacher_started_at')->nullable()->after('student_present');

            // When teacher ended the session
            $table->timestamp('teacher_ended_at')->nullable()->after('teacher_started_at');
        });
    }

    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn(['teacher_present', 'student_present', 'teacher_started_at', 'teacher_ended_at']);
        });
    }
};

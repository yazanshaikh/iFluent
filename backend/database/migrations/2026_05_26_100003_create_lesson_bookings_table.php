<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row = one lesson the student booked.
 *
 * lifecycle:
 *   scheduled → in_progress (teacher opens session) → completed → (quiz passed → quiz_locked)
 *
 * The lesson content (pre-activity, quiz questions) lives in
 *   app/Curriculum/{level_code}/Lesson{lesson_number}.php
 * The PDF URL lives in curriculum_pdfs table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_bookings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Curriculum reference (matches PHP file path)
            $table->string('level_code', 10);            // e.g. 'A1'
            $table->unsignedSmallInteger('lesson_number'); // e.g. 5

            // Time chosen by the student (stored as UTC, displayed in Jordan UTC+3)
            $table->dateTime('scheduled_at');

            // Teacher assigned/requested
            $table->foreignId('teacher_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->string('teacher_code', 20)->nullable(); // student-requested teacher

            // Teacher adds this URL when they open the live session
            $table->string('session_url')->nullable();

            $table->enum('status', [
                'scheduled',    // booked, waiting for session time
                'in_progress',  // teacher has opened the session
                'completed',    // student attended
                'cancelled',    // cancelled before session
            ])->default('scheduled');

            // Quiz state — once passed, quiz_locked = true forever
            $table->boolean('quiz_locked')->default(false);
            $table->unsignedTinyInteger('quiz_attempts')->default(0);
            $table->unsignedTinyInteger('quiz_score')->nullable();   // best score (0–100)
            $table->timestamp('quiz_passed_at')->nullable();

            $table->timestamps();

            $table->index(['student_id', 'status']);
            $table->index(['student_id', 'level_code', 'lesson_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_bookings');
    }
};

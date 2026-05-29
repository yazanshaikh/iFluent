<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores which lesson range (level + from_lesson → to_lesson) a staff member
 * assigned to a student, and tracks which lesson comes next on the next booking.
 *
 * Example: staff assigns student A1 lessons 1–36
 *   level_code   = 'A1'
 *   from_lesson  = 1
 *   to_lesson    = 36
 *   next_lesson  = 1  (auto-increments each booking until it hits to_lesson)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_curriculum_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('level_code', 10);              // A1, A2, B1 …
            $table->unsignedSmallInteger('from_lesson');   // first lesson number (inclusive)
            $table->unsignedSmallInteger('to_lesson');     // last lesson number (inclusive)

            // Pointer to the lesson that will be booked on the NEXT booking request.
            // Starts equal to from_lesson; incremented after each successful booking.
            $table->unsignedSmallInteger('next_lesson');

            $table->foreignId('assigned_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Only one active assignment per student — staff can deactivate old ones.
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['student_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_curriculum_assignments');
    }
};

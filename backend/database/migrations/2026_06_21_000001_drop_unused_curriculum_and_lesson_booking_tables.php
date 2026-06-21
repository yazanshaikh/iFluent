<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drops two abandoned tables from the 2026-05-26 curriculum/booking batch.
 *
 * - lesson_bookings: superseded by session_requests (bookings now flow through
 *   SessionRequest, not this table). 0 rows, 0 code references anywhere.
 * - student_curriculum_assignments: feature never wired up. 0 rows, 0 references.
 *
 * (curriculum_pdfs from the same batch is intentionally kept — handled separately.
 *  PDF URLs actually live on lessons.pdf_url since 2026-05-30.)
 *
 * down() recreates both with their original schema so the migration is reversible.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('lesson_bookings');
        Schema::dropIfExists('student_curriculum_assignments');
    }

    public function down(): void
    {
        Schema::create('lesson_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('level_code', 10);
            $table->unsignedSmallInteger('lesson_number');
            $table->dateTime('scheduled_at');
            $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('teacher_code', 20)->nullable();
            $table->string('session_url')->nullable();
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
            $table->boolean('quiz_locked')->default(false);
            $table->unsignedTinyInteger('quiz_attempts')->default(0);
            $table->unsignedTinyInteger('quiz_score')->nullable();
            $table->timestamp('quiz_passed_at')->nullable();
            $table->timestamps();
            $table->index(['student_id', 'status']);
            $table->index(['student_id', 'level_code', 'lesson_number']);
        });

        Schema::create('student_curriculum_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('level_code', 10);
            $table->unsignedSmallInteger('from_lesson');
            $table->unsignedSmallInteger('to_lesson');
            $table->unsignedSmallInteger('next_lesson');
            $table->foreignId('assigned_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['student_id', 'is_active']);
        });
    }
};

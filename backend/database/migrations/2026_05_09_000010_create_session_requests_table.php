<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * session_requests — booking requests before a session is confirmed.
     *
     * Types:
     *   demo         → initiated by CC/SS from CRM (for a lead/new student)
     *   core         → student books from lesson view (random teacher pool)
     *   private      → student chose a specific teacher by teacher_code
     *   group        → student registers for a group class
     *
     * Lifecycle:
     *   pending → confirmed (teacher accepts → Daily room created → session row created)
     *           → rejected  (teacher rejects → re-enters pool for core, returned for private)
     *           → cancelled (student or staff cancels before confirmation)
     *           → expired   (no teacher accepted within the time window)
     */
    public function up(): void
    {
        Schema::create('session_requests', function (Blueprint $table) {
            $table->id();

            $table->enum('type', ['demo', 'core', 'private', 'group']);

            // Who requested it
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            // The student who will attend (same as requested_by for student-initiated)
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();

            // Teacher assignment:
            // - private: target_teacher_id is set (student chose by teacher_code)
            // - core/demo: target_teacher_id is null initially (pool), set when teacher accepts
            // - group: linked via group_class_id
            $table->foreignId('target_teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_teacher_id')->nullable()->constrained('users')->nullOnDelete();

            // What lesson to cover
            $table->foreignId('lesson_id')->nullable()->constrained('lessons')->nullOnDelete();

            // For demo type: the lead being booked for
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();

            // Scheduling
            $table->timestamp('requested_at_utc');   // what the requester asked for
            $table->timestamp('confirmed_at')->nullable();

            // Status
            $table->enum('status', ['pending', 'confirmed', 'rejected', 'cancelled', 'expired'])
                  ->default('pending');

            $table->text('rejection_reason')->nullable();
            $table->text('cancellation_reason')->nullable();

            // If confirmed, link to the actual session
            $table->foreignId('session_id')->nullable()->constrained('sessions')->nullOnDelete();

            $table->timestamps();

            $table->index(['status', 'type']);
            $table->index(['student_id', 'status']);
            $table->index(['assigned_teacher_id', 'status']);
            $table->index(['target_teacher_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_requests');
    }
};

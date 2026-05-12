<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lifecycle:  waiting → active → completed
     *                     ↘ cancelled
     *
     * Teacher creates session (waiting) → starts it (active, Daily.co room created)
     * → enters Nearpod PIN → ends it (completed, Daily.co room deleted).
     * Student joins active session: receives daily_room_url + nearpod_pin + nearpod_url.
     */
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('lesson_id')
                ->constrained('lessons')
                ->cascadeOnDelete();

            $table->foreignId('teacher_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('status', ['waiting', 'active', 'completed', 'cancelled'])
                ->default('waiting');

            // Daily.co — populated when teacher starts the session
            $table->string('daily_room_name')->nullable()->unique();
            $table->string('daily_room_url')->nullable();

            // Nearpod — teacher enters PIN manually after launching the lesson
            $table->string('nearpod_pin', 20)->nullable();

            // Timestamps
            $table->timestamp('scheduled_at')->nullable();   // planned time
            $table->timestamp('started_at')->nullable();     // when teacher pressed "start"
            $table->timestamp('ended_at')->nullable();       // when session was completed/cancelled

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};

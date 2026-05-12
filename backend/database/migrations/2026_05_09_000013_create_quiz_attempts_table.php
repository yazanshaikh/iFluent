<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Each attempt is a unique, randomly-selected subset of questions from the bank.
     * If a student fails, the next attempt pulls a DIFFERENT random set.
     *
     * Flow:
     *   GET  /quiz         → creates attempt row, stores selected_question_ids, returns questions (no answers)
     *   POST /quiz/submit  → receives {attempt_id, answers{question_id: answer_index}}, grades, saves score
     */
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();

            // The IDs of questions randomly selected for this attempt (ordered)
            $table->jsonb('selected_question_ids');

            // Student's submitted answers: {question_id: answer_index}
            $table->jsonb('submitted_answers')->nullable();

            // Grading
            $table->unsignedTinyInteger('score')->nullable();       // 0–100
            $table->unsignedTinyInteger('correct_count')->nullable();
            $table->unsignedTinyInteger('total_questions')->nullable();
            $table->boolean('passed')->default(false);

            // Timing
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();

            $table->index(['student_id', 'quiz_id']);
            $table->index(['student_id', 'lesson_id', 'passed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};

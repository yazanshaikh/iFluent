<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->foreignId('quiz_id')->nullable()->constrained('quizzes')->nullOnDelete();

            // Quiz attempt data
            $table->unsignedTinyInteger('score')->nullable();   // 0-100 (percentage)
            $table->unsignedTinyInteger('attempts')->default(0);// how many times attempted
            $table->boolean('passed')->default(false);          // score >= 60
            $table->timestamp('passed_at')->nullable();         // when first passed

            // Lesson completion
            $table->boolean('lesson_completed')->default(false);
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            // One progress record per student per lesson
            $table->unique(['student_id', 'lesson_id']);
            $table->index(['student_id', 'lesson_id', 'passed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_progress');
    }
};

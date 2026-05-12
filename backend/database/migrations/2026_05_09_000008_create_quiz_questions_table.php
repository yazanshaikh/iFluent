<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->text('question');
            // options stored as JSON array: ["option A", "option B", "option C", "option D"]
            $table->jsonb('options');
            // correct_answer is the index (0-3) of the correct option in the options array
            $table->unsignedTinyInteger('correct_answer');
            $table->unsignedSmallInteger('order')->default(0);
            $table->timestamps();

            $table->index('quiz_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};

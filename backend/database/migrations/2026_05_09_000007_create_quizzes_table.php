<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->enum('type', ['lesson', 'comprehensive'])->default('lesson');
            // lesson      → appears after every lesson (12 per unit)
            // comprehensive → appears after every 6 lessons (end-of-block test)
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique('lesson_id'); // one quiz per lesson
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};

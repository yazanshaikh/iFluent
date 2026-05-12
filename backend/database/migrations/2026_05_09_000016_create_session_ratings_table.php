<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Student rates the teacher after each completed session.
     * Rating screen appears once after session completion.
     * Notes are optional.
     */
    public function up(): void
    {
        Schema::create('session_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sessions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();

            $table->unsignedTinyInteger('rating');       // 1–5 stars
            $table->text('notes')->nullable();           // optional student comment

            $table->timestamps();

            $table->unique('session_id'); // one rating per session
            $table->index(['teacher_id', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_ratings');
    }
};

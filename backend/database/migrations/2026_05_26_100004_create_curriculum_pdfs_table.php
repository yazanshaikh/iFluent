<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores the PDF URL for each (level, lesson) pair.
 * Admin can update the PDF at any time via CRM without touching code.
 * Unique index ensures one PDF per lesson.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_pdfs', function (Blueprint $table) {
            $table->id();
            $table->string('level_code', 10);             // A1, A2 …
            $table->unsignedSmallInteger('lesson_number'); // 1, 2 …
            $table->string('pdf_url');                     // storage path or public URL
            $table->string('original_filename')->nullable();

            $table->foreignId('updated_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(['level_code', 'lesson_number']); // one PDF per lesson
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_pdfs');
    }
};

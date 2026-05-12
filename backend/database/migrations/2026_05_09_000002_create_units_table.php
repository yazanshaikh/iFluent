<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Each unit contains exactly 12 lessons.
     * At the end of each unit there is a test.
     * Selling happens per unit (one or more units per deal).
     */
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->string('name');                              // e.g. "الوحدة الأولى"
            $table->string('name_en')->nullable();              // e.g. "Unit One"
            $table->unsignedTinyInteger('order');               // position within the level
            $table->unsignedTinyInteger('lesson_count')->default(12); // always 12 per PRD
            $table->boolean('has_end_test')->default(true);    // unit-end assessment
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['level_id', 'order']);              // no duplicate positions
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};

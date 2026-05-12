<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * English levels hierarchy:
     *  1 → A1  (Foundation)             — 3 units × 12 = 36 lessons
     *  2 → A2  (Advanced Foundation)    — 3 units × 12 = 36 lessons
     *  3 → B1  (Understanding)          — 5 units × 12 = 60 lessons
     *  4 → B2  (Fluency)               — 5 units × 12 = 60 lessons
     *  5 → FT  (Free Talking / Mastery) — 5 units × 12 = 60 lessons
     *                                              Total = 252 lessons
     */
    public function up(): void
    {
        Schema::create('levels', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();          // A1, A2, B1, B2, FT
            $table->string('name');                        // e.g. "مرحلة التأسيس"
            $table->string('name_en');                     // e.g. "Foundation"
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('order');          // 1–5, for sorting
            $table->unsignedTinyInteger('total_units');    // 3 or 5
            $table->unsignedSmallInteger('total_lessons'); // 36 or 60
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('levels');
    }
};

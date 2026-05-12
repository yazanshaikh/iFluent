<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 252 lessons total across all levels & units.
     * Each lesson is delivered via Nearpod (WebView) + Daily.co (video).
     */
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained()->cascadeOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('order');        // 1–12 within the unit

            // Nearpod integration
            $table->string('nearpod_lesson_id')->nullable(); // Nearpod's internal lesson id
            $table->string('nearpod_url')->nullable();       // URL teacher opens in WebView

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['unit_id', 'order']);            // no duplicate positions per unit
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};

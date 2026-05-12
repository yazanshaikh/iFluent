<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Teacher weekly availability slots.
     *
     * day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
     * start_time / end_time: stored as TIME (HH:MM:SS) in UTC
     * Teacher sets their local time in the app; frontend converts to UTC before sending.
     *
     * A slot means: "I am available every week on this day between these times."
     * Students see availability converted to Jordan Time (UTC+3).
     */
    public function up(): void
    {
        Schema::create('teacher_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0=Sun … 6=Sat
            $table->time('start_time');                 // UTC
            $table->time('end_time');                   // UTC
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['teacher_id', 'day_of_week', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_availability');
    }
};

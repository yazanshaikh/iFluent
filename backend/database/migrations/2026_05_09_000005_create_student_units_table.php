<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tracks which units each student has purchased/been enrolled in.
     * Enrollment is assigned by admin after subscription approval.
     * Students can only attend sessions for lessons in their enrolled units.
     */
    public function up(): void
    {
        Schema::create('student_units', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('unit_id')
                ->constrained('units')
                ->cascadeOnDelete();

            $table->enum('status', ['active', 'completed', 'expired'])
                ->default('active');

            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at')->nullable();     // optional expiry

            $table->timestamps();

            // A student can only be enrolled once per unit
            $table->unique(['student_id', 'unit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_units');
    }
};

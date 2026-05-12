<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('teacher_code', 20)->unique();   // auto-generated code for student lookup
            $table->text('bio')->nullable();
            $table->string('specialization')->nullable();
            $table->string('profile_photo')->nullable();
            $table->decimal('commission_rate', 8, 2)->default(0.00);
            $table->decimal('balance', 10, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->string('zoom_user_id')->nullable();     // connected Zoom account
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};

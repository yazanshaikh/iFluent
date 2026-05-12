<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('session_id')->constrained('sessions')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('session_type', 20)->default('core'); // core | demo | group
            $table->text('notes')->nullable();
            $table->timestamp('credited_at');
            $table->timestamps();

            $table->unique('session_id'); // one earning entry per session
            $table->index(['teacher_id', 'credited_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_earnings');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            // How many questions to randomly pick from the bank per attempt
            $table->unsignedTinyInteger('questions_per_attempt')->default(10)->after('type');
            // Minimum questions required in the bank before quiz is considered "ready"
            $table->unsignedTinyInteger('min_bank_size')->default(10)->after('questions_per_attempt');
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn(['questions_per_attempt', 'min_bank_size']);
        });
    }
};

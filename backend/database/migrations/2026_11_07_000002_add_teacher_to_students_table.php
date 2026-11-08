<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The teacher a subscribed student is assigned to (one teacher per student).
 * Organisational only — does not restrict bookings.
 *
 * nullOnDelete: when a teacher is permanently deleted, their students simply
 * go back to the "no teacher" pool. Deactivating (soft delete) keeps them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('teacher_user_id')->nullable()->after('lead_id')
                  ->constrained('users')->nullOnDelete();
            $table->index('teacher_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('teacher_user_id');
        });
    }
};

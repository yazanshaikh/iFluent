<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One point for the teacher of a student's last attended trial session, when
 * that student subscribes for the first time. Points are counted separately
 * from sessions and earn their own commission (teachers.conversion_commission_rate).
 *
 * student_id is UNIQUE on purpose: one point per student, ever. The point stays
 * even if the subscription is later cancelled.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_conversion_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_id')->unique()->constrained('students')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('sessions')->nullOnDelete();
            $table->timestamp('awarded_at');
            $table->timestamps();

            $table->index(['teacher_id', 'awarded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_conversion_points');
    }
};

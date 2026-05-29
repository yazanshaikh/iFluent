<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Public eval bookings are created before the person has a student account.
 * Allow student_id to be NULL — it gets filled when CC converts the lead.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('session_requests', function (Blueprint $table) {
            $table->foreignId('student_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('session_requests', function (Blueprint $table) {
            $table->foreignId('student_id')->nullable(false)->change();
        });
    }
};

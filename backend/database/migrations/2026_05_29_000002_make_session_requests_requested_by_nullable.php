<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Public bookings (student app / landing page) have no authenticated staff user.
 * Allow requested_by to be NULL for system-generated demo booking requests.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('session_requests', function (Blueprint $table) {
            $table->foreignId('requested_by')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('session_requests', function (Blueprint $table) {
            $table->foreignId('requested_by')->nullable(false)->change();
        });
    }
};

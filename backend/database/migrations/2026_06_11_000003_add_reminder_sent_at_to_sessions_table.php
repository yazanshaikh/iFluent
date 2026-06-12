<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            // Set when the pre-session push reminder has been sent (prevents dupes)
            $table->timestamp('reminder_sent_at')->nullable()->after('evaluation_submitted_at');
        });
    }

    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn('reminder_sent_at');
        });
    }
};

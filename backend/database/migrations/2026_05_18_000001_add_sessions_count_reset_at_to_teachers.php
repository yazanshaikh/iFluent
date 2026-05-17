<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('teachers', function (Blueprint $table) {
            $table->timestamp('sessions_count_reset_at')->nullable()->after('zoom_user_id');
        });
    }
    public function down(): void {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn('sessions_count_reset_at');
        });
    }
};

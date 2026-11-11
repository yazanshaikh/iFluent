<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Same as individual lessons: the teacher enters the Nearpod PIN to start.
        Schema::table('group_classes', function (Blueprint $table) {
            $table->string('nearpod_pin', 50)->nullable()->after('daily_room_url');
        });
    }

    public function down(): void
    {
        Schema::table('group_classes', function (Blueprint $table) {
            $table->dropColumn('nearpod_pin');
        });
    }
};

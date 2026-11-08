<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Commission (JOD) a teacher earns per completed group class. Defaults to 0, so
 * no balance changes until an admin sets a rate for that teacher.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->decimal('group_commission_rate', 10, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn('group_commission_rate');
        });
    }
};

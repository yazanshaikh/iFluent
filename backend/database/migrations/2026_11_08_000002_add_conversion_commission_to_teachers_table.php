<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Commission (JOD) a teacher earns for each conversion point. Separate from the
 * per-session rate: conversions are not sessions and don't count in the total.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->decimal('conversion_commission_rate', 10, 2)->default(1.00);
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn('conversion_commission_rate');
        });
    }
};

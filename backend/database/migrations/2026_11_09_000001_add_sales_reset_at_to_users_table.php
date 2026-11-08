<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Start of a CC's current sales counter. Existing CCs start from this deploy, so
 * older sales are not counted. A CC created later starts from their join date.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('sales_reset_at')->nullable();
        });

        DB::table('users')->where('role', 'cc')->update(['sales_reset_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('sales_reset_at');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * lead_remarks.staff_id was NOT NULL, but system-generated remarks (e.g. the
 * landing-page booking note) have no staff author and are created with
 * staff_id = null → NOT NULL violation → 500 after the lead is already saved.
 * Make it nullable so system remarks are allowed. The FK + restrictOnDelete
 * stay in place for real (non-null) staff remarks.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_remarks', function (Blueprint $table) {
            $table->unsignedBigInteger('staff_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('lead_remarks', function (Blueprint $table) {
            $table->unsignedBigInteger('staff_id')->nullable(false)->change();
        });
    }
};

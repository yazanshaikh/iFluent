<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * teachers.balance_reset_at / absences_reset_at are in the model's fillable +
 * casts, read by StaffResource, and WRITTEN by the admin reset action
 * (StaffController: $teacher->update(['balance_reset_at' => now()])) — but the
 * migration meant to add them (add_reset_fields_to_teachers) shipped as an empty
 * stub. On a clean production DB the columns were absent → 500 whenever the
 * reset action ran. Add them (nullable timestamps), guarded for dev DBs that
 * were hand-patched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            if (! Schema::hasColumn('teachers', 'balance_reset_at')) {
                $table->timestamp('balance_reset_at')->nullable();
            }
            if (! Schema::hasColumn('teachers', 'absences_reset_at')) {
                $table->timestamp('absences_reset_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            foreach (['balance_reset_at', 'absences_reset_at'] as $col) {
                if (Schema::hasColumn('teachers', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Amounts an admin records on a CC: what the CC is due, and refunds.
 * Resetting marks entries as settled instead of deleting them, so the history
 * of what was added and paid is kept.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cc_ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 10);                 // due | refund
            $table->decimal('amount', 10, 2);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('settled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type', 'settled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cc_ledger_entries');
    }
};

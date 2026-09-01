<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * In-app purchases (Apple StoreKit today; the platform column leaves room for
 * Google Play later).
 *
 * transaction_id is UNIQUE on purpose: it is the ONLY thing stopping the same
 * receipt from being replayed to mint unlimited paid bookings. Every grant must
 * go through an insert here first.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('iap_purchases', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->string('platform', 20)->default('ios');   // ios | android
            $table->string('product_id');

            // Apple's transaction id — the replay guard.
            $table->string('transaction_id')->unique();
            $table->string('original_transaction_id')->nullable();

            // The booking this purchase paid for (null until it is created).
            $table->foreignId('session_request_id')->nullable()
                  ->constrained('session_requests')->nullOnDelete();

            $table->timestamp('purchased_at')->nullable();
            $table->jsonb('payload')->nullable();             // verified receipt, for audits

            $table->timestamps();

            $table->index(['user_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('iap_purchases');
    }
};

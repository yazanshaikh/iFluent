<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('package_id')->constrained('packages')->restrictOnDelete();
            // activated_by: the sales staff or admin who activated this subscription
            $table->foreignId('activated_by')->nullable()->constrained('users')->nullOnDelete();
            // approved_by: the manager who approved the payment
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', [
                'pending_approval',  // payment uploaded, awaiting manager approval
                'active',            // approved and live
                'expired',           // past expires_at
                'cancelled',
            ])->default('pending_approval');
            $table->decimal('amount_paid', 10, 2)->nullable();
            $table->string('payment_method')->nullable();     // cash, efawateer, card
            $table->string('payment_reference')->nullable();  // transaction number
            $table->string('payment_screenshot')->nullable(); // file path
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('student_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};

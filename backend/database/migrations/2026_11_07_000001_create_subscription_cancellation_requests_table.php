<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cancellation requests raised by CC / SS staff on a subscribed student.
 * A request never cancels anything by itself — a super_admin approves
 * (→ the subscription is cancelled) or rejects (→ nothing changes).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_cancellation_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();

            $table->text('reason');
            $table->string('status', 20)->default('pending');   // pending | approved | rejected

            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();

            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['requested_by', 'created_at']);
        });

        // Only ONE pending request per subscription — enforced by the DB, so two
        // staff clicking at the same time can't both get through.
        DB::statement(
            "CREATE UNIQUE INDEX sub_cancel_req_one_pending
             ON subscription_cancellation_requests (subscription_id)
             WHERE status = 'pending'"
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_cancellation_requests');
    }
};

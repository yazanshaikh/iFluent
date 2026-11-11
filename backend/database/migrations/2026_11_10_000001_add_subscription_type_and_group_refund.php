<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Every existing subscription is an individual one.
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('subscription_type', 20)->default('individual')->after('status');
        });

        Schema::table('group_class_registrations', function (Blueprint $table) {
            $table->timestamp('credit_refunded_at')->nullable()->after('joined_at');
        });
    }

    public function down(): void
    {
        Schema::table('group_class_registrations', function (Blueprint $table) {
            $table->dropColumn('credit_refunded_at');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('subscription_type');
        });
    }
};

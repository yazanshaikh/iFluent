<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add new columns
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->uuid('invoice_uuid')->unique()->nullable()->after('id');
            $table->unsignedSmallInteger('months_count')->default(1)->after('package_id');
            $table->foreignId('payment_account_id')->nullable()->after('months_count')
                ->constrained('payment_accounts')->nullOnDelete();
        });

        // Make package_id nullable (PostgreSQL raw SQL)
        DB::statement('ALTER TABLE subscriptions ALTER COLUMN package_id DROP NOT NULL');

        // Drop old FK constraint and re-add with SET NULL on delete
        DB::statement('ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_package_id_foreign');
        DB::statement('ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_package_id_foreign FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL');

        // Expand status enum to include pending_screenshot
        DB::statement("ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check");
        DB::statement("ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('pending_screenshot','pending_approval','active','expired','cancelled'))");
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropForeign(['payment_account_id']);
            $table->dropColumn(['invoice_uuid', 'months_count', 'payment_account_id']);
        });

        // Restore original status constraint
        DB::statement("ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check");
        DB::statement("ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('pending_approval','active','expired','cancelled'))");

        // Restore package_id NOT NULL
        DB::statement('ALTER TABLE subscriptions ALTER COLUMN package_id SET NOT NULL');
    }
};

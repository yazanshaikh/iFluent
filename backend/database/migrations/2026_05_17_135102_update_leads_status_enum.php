<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Migrate old data (idempotent — safe to run multiple times)
        DB::statement("UPDATE leads SET status = 'new' WHERE status = 'assigned'");
        DB::statement("UPDATE leads SET status = 'in_progress' WHERE status = 'working'");

        // Step 2: Replace the CHECK constraint with the new status values
        DB::statement("ALTER TABLE leads ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check");

        DB::statement("
            ALTER TABLE leads
            ALTER COLUMN status TYPE VARCHAR(30)
            USING status::VARCHAR
        ");

        DB::statement("
            ALTER TABLE leads
            ADD CONSTRAINT leads_status_check
            CHECK (status IN (
                'new',
                'in_progress',
                'interested',
                'not_interested',
                'postponed',
                'open_sea',
                'subscriber'
            ))
        ");

        DB::statement("ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE leads ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check");

        // Reverse data migration
        DB::statement("UPDATE leads SET status = 'working' WHERE status = 'in_progress'");
        DB::statement("UPDATE leads SET status = 'assigned' WHERE status = 'new' AND assigned_to IS NOT NULL");

        DB::statement("
            ALTER TABLE leads
            ALTER COLUMN status TYPE VARCHAR(20)
            USING status::VARCHAR
        ");

        DB::statement("ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new'");
    }
};

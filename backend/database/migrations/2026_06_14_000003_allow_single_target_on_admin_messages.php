<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Allow a 'single' target on admin_messages so a message can be addressed to one
 * specific student (e.g. an invoice link), not only broadcast groups.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE admin_messages DROP CONSTRAINT IF EXISTS admin_messages_target_check');
        DB::statement("ALTER TABLE admin_messages ADD CONSTRAINT admin_messages_target_check CHECK (target IN ('all','subscribers','non_subscribers','single'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE admin_messages DROP CONSTRAINT IF EXISTS admin_messages_target_check');
        DB::statement("ALTER TABLE admin_messages ADD CONSTRAINT admin_messages_target_check CHECK (target IN ('all','subscribers','non_subscribers'))");
    }
};

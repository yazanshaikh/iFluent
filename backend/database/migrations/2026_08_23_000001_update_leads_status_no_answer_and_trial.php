<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Lead pipeline statuses reworked:
 *   - in_progress (قيد التنفيذ)  →  no_answer (مارد — لم يرد)
 *   - new status: trial_session (حصة تجريبية)
 *
 * Existing in_progress leads move to no_answer: it replaces that stage in the
 * pipeline, so leaving them on a value the UI no longer offers would strand them
 * with a blank status badge.
 */
return new class extends Migration
{
    private const STATUSES = [
        'new',
        'no_answer',
        'interested',
        'not_interested',
        'postponed',
        'trial_session',
        'open_sea',   // system — auto-expiry
        'subscriber', // system — checkout
    ];

    public function up(): void
    {
        // The CHECK constraint must accept the new values before any row uses them.
        DB::statement('ALTER TABLE leads ALTER COLUMN status DROP DEFAULT');
        DB::statement('ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check');

        DB::statement("UPDATE leads SET status = 'no_answer' WHERE status = 'in_progress'");

        $list = "'" . implode("', '", self::STATUSES) . "'";
        DB::statement("ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ({$list}))");
        DB::statement("ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new'");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE leads ALTER COLUMN status DROP DEFAULT');
        DB::statement('ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check');

        DB::statement("UPDATE leads SET status = 'in_progress' WHERE status = 'no_answer'");
        // trial_session has no pre-existing equivalent — park those in the pipeline.
        DB::statement("UPDATE leads SET status = 'in_progress' WHERE status = 'trial_session'");

        DB::statement("
            ALTER TABLE leads
            ADD CONSTRAINT leads_status_check
            CHECK (status IN (
                'new', 'in_progress', 'interested', 'not_interested',
                'postponed', 'open_sea', 'subscriber'
            ))
        ");
        DB::statement("ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new'");
    }
};

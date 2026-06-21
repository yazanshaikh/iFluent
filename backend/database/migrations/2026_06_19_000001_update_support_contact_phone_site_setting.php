<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // site_settings.value is a jsonb column — the value must be JSON-encoded,
        // otherwise '0780105274' is parsed as a bare JSON number (invalid: leading
        // zero) and Postgres rejects it with SQLSTATE 22P02.
        DB::table('site_settings')
            ->whereIn('key', ['contact_phone', 'contact_whatsapp'])
            ->update([
                'value'      => json_encode('0780105274'),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Intentionally empty — do not restore old support numbers
    }
};

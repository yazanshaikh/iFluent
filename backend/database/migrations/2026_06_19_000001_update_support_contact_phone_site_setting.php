<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('site_settings')
            ->whereIn('key', ['contact_phone', 'contact_whatsapp'])
            ->update([
                'value'      => '0780105274',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Intentionally empty — do not restore old support numbers
    }
};

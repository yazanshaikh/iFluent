<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            // value is JSONB to support strings, arrays, objects, booleans
            $table->jsonb('value')->nullable();
            $table->string('type', 20)->default('text'); // text | image | html | json | boolean
            $table->string('label')->nullable();          // human-readable label for CRM UI
            $table->string('group', 50)->default('general'); // hero | about | contact | footer | general
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};

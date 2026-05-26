<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notebook_entries', function (Blueprint $table) {
            // general | grammar | examples | observations
            $table->string('category')->default('general')->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('notebook_entries', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};

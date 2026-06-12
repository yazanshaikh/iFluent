<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            // Wordwall (or any external) interactive activity link for this lesson.
            // Opened in a WebView from the student app on demand.
            $table->string('activity_url')->nullable()->after('pdf_url');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('activity_url');
        });
    }
};

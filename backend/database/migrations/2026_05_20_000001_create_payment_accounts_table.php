<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('alias');        // e.g. "iFluent26", "IFLUENT3", "IFLUENT"
            $table->string('cliq_name');    // e.g. "محفظة أمنية يو واليت"
            $table->integer('sort_order');  // 1, 2, 3 — round-robin order
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_accounts');
    }
};

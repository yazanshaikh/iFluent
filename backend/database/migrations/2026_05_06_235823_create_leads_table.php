<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 20)->unique();
            $table->string('source')->nullable();          // e.g. Facebook, Instagram, Website
            $table->unsignedSmallInteger('age')->nullable();
            $table->enum('status', [
                'new',          // just added, unassigned
                'assigned',     // given to a sales staff
                'working',      // staff is actively following up
                'open_sea',     // auto-migrated after 5 days with no conversion
                'subscriber',   // converted — student account created
            ])->default('new');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_small_treasure')->default(false);
            $table->timestamp('moved_to_open_sea_at')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('assigned_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};

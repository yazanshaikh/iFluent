<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_messages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->enum('target', ['all', 'subscribers', 'non_subscribers']);
            $table->foreignId('sent_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // Pivot: one row per (message × student) — resolved at send time
        Schema::create('admin_message_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->unique(['admin_message_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_message_recipients');
        Schema::dropIfExists('admin_messages');
    }
};

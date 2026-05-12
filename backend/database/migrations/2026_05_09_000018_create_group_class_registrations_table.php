<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_class_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_class_id')->constrained('group_classes')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('registered_at');
            $table->timestamp('joined_at')->nullable();   // set when student calls /join
            $table->timestamps();

            $table->unique(['group_class_id', 'student_id']);
            $table->index(['student_id', 'group_class_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_class_registrations');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('vaccination_id')->nullable()->constrained('vaccinations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('channel', 16)->default('sms');
            $table->string('type', 20)->default('upcoming');
            $table->dateTime('send_at');
            $table->dateTime('sent_at')->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('message');
            $table->text('provider_response')->nullable();
            $table->timestamps();

            $table->index(['status', 'send_at']);
            $table->index(['appointment_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
    }
};

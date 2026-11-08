<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vaccinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained('pets')->cascadeOnDelete();
            $table->string('name');
            $table->date('administered_at');
            $table->date('next_due_at')->nullable()->index();
            $table->string('vet_name')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['pet_id', 'administered_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vaccinations');
    }
};

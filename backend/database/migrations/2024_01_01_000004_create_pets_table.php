<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('species', 32)->default('dog');
            $table->string('breed')->nullable();
            $table->string('sex', 16)->default('unknown');
            $table->date('birth_date')->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->string('color')->nullable();
            $table->string('microchip')->nullable();
            $table->text('notes')->nullable();
            $table->string('photo')->nullable();
            $table->timestamps();

            $table->index(['owner_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};

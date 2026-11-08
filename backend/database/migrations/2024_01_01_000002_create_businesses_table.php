<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->decimal('commission_rate', 6, 4)->default(0.1000);
            $table->string('timezone', 64)->default('UTC');
            $table->boolean('active')->default(true);
            // Linked Directus CMS account (used by business owners to open the Studio).
            $table->uuid('cms_user_id')->nullable()->index();
            $table->timestamps();

            $table->index(['active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};

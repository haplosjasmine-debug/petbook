<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('payment_provider', 30)->nullable()->after('net_amount');
            $table->string('payment_method', 30)->nullable()->after('payment_provider');
            $table->string('payment_status', 20)->default('unpaid')->after('payment_method');
            $table->string('payment_reference', 100)->nullable()->after('payment_status');
            $table->string('checkout_session_id', 100)->nullable()->after('payment_reference');
            $table->text('checkout_url')->nullable()->after('checkout_session_id');
            $table->dateTime('payment_paid_at')->nullable()->after('checkout_url');
            $table->json('payment_payload')->nullable()->after('payment_paid_at');

            $table->index('payment_status');
            $table->index('checkout_session_id');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['checkout_session_id']);
            $table->dropColumn([
                'payment_provider',
                'payment_method',
                'payment_status',
                'payment_reference',
                'checkout_session_id',
                'checkout_url',
                'payment_paid_at',
                'payment_payload',
            ]);
        });
    }
};

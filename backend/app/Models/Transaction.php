<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'owner_id',
        'appointment_id',
        'package_purchase_id',
        'amount',
        'commission_rate',
        'commission_amount',
        'net_amount',
        'status',
        'paid_at',
        'payment_provider',
        'payment_method',
        'payment_status',
        'payment_reference',
        'checkout_session_id',
        'checkout_url',
        'payment_paid_at',
        'payment_payload',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'commission_rate' => 'decimal:4',
        'commission_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'status' => TransactionStatus::class,
        'paid_at' => 'datetime',
        'payment_status' => PaymentStatus::class,
        'payment_paid_at' => 'datetime',
        'payment_payload' => 'array',
    ];

    public function isPaid(): bool
    {
        return $this->payment_status === PaymentStatus::Paid;
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function packagePurchase(): BelongsTo
    {
        return $this->belongsTo(PackagePurchase::class);
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('status', TransactionStatus::Paid->value);
    }

    public function scopeForBusiness(Builder $query, int $businessId): Builder
    {
        return $query->where('business_id', $businessId);
    }

    public function scopePaidToBusiness(Builder $query): Builder
    {
        return $query->where('payment_status', PaymentStatus::Paid->value);
    }
}

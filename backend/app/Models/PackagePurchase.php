<?php

namespace App\Models;

use App\Enums\PackageStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PackagePurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_package_id',
        'business_id',
        'owner_id',
        'pet_id',
        'sessions_total',
        'sessions_remaining',
        'paid_amount',
        'expires_at',
        'status',
    ];

    protected $casts = [
        'sessions_total' => 'integer',
        'sessions_remaining' => 'integer',
        'paid_amount' => 'decimal:2',
        'expires_at' => 'date',
        'status' => PackageStatus::class,
    ];

    public function servicePackage(): BelongsTo
    {
        return $this->belongsTo(ServicePackage::class);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', PackageStatus::Active->value);
    }

    public function isUsable(): bool
    {
        return $this->status === PackageStatus::Active
            && $this->sessions_remaining > 0
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }
}

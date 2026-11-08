<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vaccination extends Model
{
    use HasFactory;

    protected $fillable = [
        'pet_id',
        'name',
        'administered_at',
        'next_due_at',
        'vet_name',
        'notes',
    ];

    protected $casts = [
        'administered_at' => 'date',
        'next_due_at' => 'date',
    ];

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function scopeDueBefore(Builder $query, $date): Builder
    {
        return $query->whereNotNull('next_due_at')->where('next_due_at', '<=', $date);
    }

    public function isOverdue(): bool
    {
        return $this->next_due_at !== null && $this->next_due_at->isPast();
    }
}

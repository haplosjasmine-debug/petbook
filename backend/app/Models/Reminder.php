<?php

namespace App\Models;

use App\Enums\ReminderChannel;
use App\Enums\ReminderStatus;
use App\Enums\ReminderType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'vaccination_id',
        'user_id',
        'channel',
        'type',
        'send_at',
        'sent_at',
        'status',
        'message',
        'provider_response',
    ];

    protected $casts = [
        'channel' => ReminderChannel::class,
        'type' => ReminderType::class,
        'status' => ReminderStatus::class,
        'send_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function vaccination(): BelongsTo
    {
        return $this->belongsTo(Vaccination::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeDue(Builder $query): Builder
    {
        return $query->where('status', ReminderStatus::Pending->value)
            ->where('send_at', '<=', now());
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', ReminderStatus::Pending->value);
    }
}

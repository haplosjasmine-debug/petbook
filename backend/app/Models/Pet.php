<?php

namespace App\Models;

use App\Enums\PetSex;
use App\Enums\Species;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pet extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'species',
        'breed',
        'sex',
        'birth_date',
        'weight_kg',
        'color',
        'microchip',
        'notes',
        'photo',
    ];

    protected $casts = [
        'species' => Species::class,
        'sex' => PetSex::class,
        'birth_date' => 'date',
        'weight_kg' => 'decimal:2',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function vaccinations(): HasMany
    {
        return $this->hasMany(Vaccination::class);
    }

    public function medicalRecords(): HasMany
    {
        return $this->hasMany(MedicalRecord::class);
    }

    public function packagePurchases(): HasMany
    {
        return $this->hasMany(PackagePurchase::class);
    }

    public function ageInYears(): ?int
    {
        return $this->birth_date?->age;
    }

    public function nextVaccinationDue(): ?Vaccination
    {
        return $this->vaccinations()
            ->whereNotNull('next_due_at')
            ->orderBy('next_due_at')
            ->first();
    }
}

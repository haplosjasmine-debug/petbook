<?php

namespace Database\Seeders;

use App\Enums\ServiceCategory;
use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Business;
use App\Models\Pet;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@petbook.app'],
            [
                'first_name' => 'Platform',
                'last_name' => 'Admin',
                'phone' => '+15550000001',
                'role' => UserRole::Admin,
                'active' => true,
                'password' => 'password',
            ]
        );

        $owner = User::query()->firstOrCreate(
            ['email' => 'owner@petbook.app'],
            [
                'first_name' => 'Olivia',
                'last_name' => 'Owner',
                'phone' => '+15550000002',
                'role' => UserRole::Business,
                'active' => true,
                'password' => 'password',
            ]
        );

        $business = Business::query()->firstOrCreate(
            ['slug' => 'happy-paws-grooming'],
            [
                'owner_id' => $owner->id,
                'name' => 'Happy Paws Grooming',
                'email' => 'hello@happypaws.app',
                'phone' => '+15550000003',
                'address' => '12 Bark Street',
                'city' => 'Springfield',
                'description' => 'Friendly neighborhood grooming and wellness studio.',
                'commission_rate' => 0.10,
                'timezone' => 'UTC',
                'active' => true,
            ]
        );

        $services = [
            ['name' => 'Bath & Brush', 'category' => ServiceCategory::Grooming, 'duration_min' => 45, 'price' => 35],
            ['name' => 'Full Groom', 'category' => ServiceCategory::Grooming, 'duration_min' => 90, 'price' => 70],
            ['name' => 'Wellness Exam', 'category' => ServiceCategory::Veterinary, 'duration_min' => 30, 'price' => 55],
            ['name' => 'Nail Trim', 'category' => ServiceCategory::Grooming, 'duration_min' => 15, 'price' => 15],
        ];

        foreach ($services as $data) {
            Service::query()->firstOrCreate(
                ['business_id' => $business->id, 'name' => $data['name']],
                $data + ['active' => true]
            );
        }

        $staffData = [
            ['name' => 'Ava Groomer', 'role' => StaffRole::Groomer],
            ['name' => 'Dr. Max Vet', 'role' => StaffRole::Vet],
        ];

        foreach ($staffData as $data) {
            Staff::query()->firstOrCreate(
                ['business_id' => $business->id, 'name' => $data['name']],
                $data + ['active' => true]
            );
        }

        $customer = User::query()->firstOrCreate(
            ['email' => 'customer@petbook.app'],
            [
                'first_name' => 'Casey',
                'last_name' => 'Customer',
                'phone' => '+15550000004',
                'role' => UserRole::Owner,
                'active' => true,
                'password' => 'password',
            ]
        );

        Pet::query()->firstOrCreate(
            ['owner_id' => $customer->id, 'name' => 'Biscuit'],
            [
                'species' => 'dog',
                'breed' => 'Corgi',
                'sex' => 'male',
                'birth_date' => now()->subYears(3)->toDateString(),
                'weight_kg' => 12.4,
                'color' => 'Tan',
                'microchip' => '985'.Str::random(12),
            ]
        );
    }
}

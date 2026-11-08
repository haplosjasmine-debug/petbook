<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_pet_owner_can_register_and_use_the_api_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Casey',
            'last_name' => 'Customer',
            'email' => 'casey@example.test',
            'phone' => '+639171234567',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
            'role' => 'owner',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.email', 'casey@example.test')
            ->assertJsonStructure(['data' => ['token', 'user' => ['id', 'first_name', 'role']]]);

        $token = $response->json('data.token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'casey@example.test')
            ->assertJsonPath('data.business', null);
    }

    public function test_business_registration_creates_a_business_and_manager_staff(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'first_name' => 'Olivia',
            'last_name' => 'Owner',
            'email' => 'olivia@example.test',
            'phone' => '+639181234567',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
            'role' => 'business',
            'business_name' => 'Happy Paws Manila',
            'address' => '12 Bark Street',
            'city' => 'Manila',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.business.name', 'Happy Paws Manila')
            ->assertJsonPath('data.business.commission_rate', '0.1000');

        $this->assertDatabaseHas('staff', [
            'business_id' => $response->json('data.business.id'),
            'name' => 'Olivia Owner',
        ]);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->owner()->create(['email' => 'known@example.test']);

        $this->postJson('/api/auth/login', [
            'email' => 'known@example.test',
            'password' => 'wrong-password',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_unauthenticated_api_requests_return_json_401_instead_of_redirecting(): void
    {
        $this->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::create([
            'name' => 'Administrator',
            'username' => 'mavs',
            'email' => 'admin@icesystem.com',
            'password' => bcrypt('123'),
            'user_type' => 1, // Admin
        ]);
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds for production admin user.
     */
    public function run(): void
    {
        // Create Jericho admin user for production
        User::create([
            'name' => 'Jericho',
            'username' => 'jericho',
            'email' => 'jericho@rdaicesystem.com',
            'password' => Hash::make('password'), // Default password: "password"
            'user_type' => 1, // Admin
            'position' => 'System Administrator',
            'contact_number' => '09123456789',
            'status' => 'active',
        ]);

        $this->command->info('✅ Admin user "jericho" created successfully!');
        $this->command->info('📧 Email: jericho@rdaicesystem.com');
        $this->command->info('🔑 Username: jericho');
        $this->command->info('🔒 Password: password');
        $this->command->warn('⚠️  Please change the password after first login!');
    }
}
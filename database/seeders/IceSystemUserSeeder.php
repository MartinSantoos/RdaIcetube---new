<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class IceSystemUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::create([
            'name' => 'Administrator',
            'username' => 'mavs',
            'email' => 'admin@icesystem.com',
            'password' => bcrypt('123'),
            'user_type' => 1, // Admin
        ]);

        \App\Models\User::create([
            'name' => 'Martin Employee',
            'username' => 'martin',
            'email' => 'martin@icesystem.com',
            'password' => bcrypt('12345'),
            'user_type' => 2, // Employee
        ]);
    }
}

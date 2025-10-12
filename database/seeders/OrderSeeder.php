<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\Inventory;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample inventory first
        Inventory::create([
            'product_name' => 'Tube Ice Small',
            'size' => 'small',
            'quantity' => 100,
            'price' => 50,
            'status' => 'available',
            'date_created' => now()
        ]);

        Inventory::create([
            'product_name' => 'Tube Ice Medium',
            'size' => 'medium',
            'quantity' => 100,
            'price' => 100,
            'status' => 'available',
            'date_created' => now()
        ]);

        Inventory::create([
            'product_name' => 'Tube Ice Large',
            'size' => 'large',
            'quantity' => 100,
            'price' => 150,
            'status' => 'available',
            'date_created' => now()
        ]);

        // Create sample orders
        Order::create([
            'customer_name' => 'Martin Rodriguez',
            'address' => '123 Main Street, Mecauyan, Bulacan',
            'contact_number' => '09123456789',
            'quantity' => 2,
            'size' => 'medium',
            'status' => 'completed',
            'order_date' => '2025-09-24',
            'delivery_date' => '2025-09-25',
            'delivery_mode' => 'pick_up'
        ]);

        Order::create([
            'customer_name' => 'Martin Rodriguez',
            'address' => '456 Oak Avenue, Mecauyan, Bulacan',
            'contact_number' => '09123456789',
            'quantity' => 10,
            'size' => 'medium',
            'status' => 'cancelled',
            'order_date' => '2025-09-24',
            'delivery_date' => '2025-09-25',
            'delivery_mode' => 'pick_up'
        ]);

        Order::create([
            'customer_name' => 'Martin Rodriguez',
            'address' => '789 Pine Road, Mecauyan, Bulacan',
            'contact_number' => '09123456789',
            'quantity' => 5,
            'size' => 'medium',
            'status' => 'pending',
            'order_date' => '2025-09-14',
            'delivery_date' => '2025-09-15',
            'delivery_mode' => 'pick_up'
        ]);
    }
}
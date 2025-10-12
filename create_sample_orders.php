<?php

require_once 'vendor/autoload.php';
require_once 'bootstrap/app.php';

use App\Models\Order;
use App\Models\Inventory;

// Create sample inventory first
Inventory::create([
    'size' => 'small',
    'quantity' => 100,
    'price' => 50,
    'status' => 'available'
]);

Inventory::create([
    'size' => 'medium',
    'quantity' => 100,
    'price' => 100,
    'status' => 'available'
]);

Inventory::create([
    'size' => 'large',
    'quantity' => 100,
    'price' => 150,
    'status' => 'available'
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

echo "Sample orders created successfully!\n";
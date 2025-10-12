<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    // Check if inventory migration is already in the migrations table
    $inventoryExists = DB::table('migrations')
        ->where('migration', '2025_09_12_025932_create_inventory_table')
        ->exists();
    
    if (!$inventoryExists) {
        // Insert the inventory migration record
        DB::table('migrations')->insert([
            'migration' => '2025_09_12_025932_create_inventory_table',
            'batch' => 3
        ]);
        echo "Inventory migration marked as completed\n";
    } else {
        echo "Inventory migration already marked as completed\n";
    }
    
    // Check if orders migration is already in the migrations table  
    $ordersExists = DB::table('migrations')
        ->where('migration', '2025_09_09_053004_create_orders_table')
        ->exists();
    
    if (!$ordersExists) {
        // Insert the orders migration record
        DB::table('migrations')->insert([
            'migration' => '2025_09_09_053004_create_orders_table',
            'batch' => 3
        ]);
        echo "Orders migration marked as completed\n";
    } else {
        echo "Orders migration already marked as completed\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

<?php
use Illuminate\Support\Facades\DB;

echo "Checking inventory directly from database:\n";
echo "========================================\n";

try {
    // Direct database query
    $results = DB::select('SELECT product_name, size, quantity, status FROM inventory ORDER BY quantity ASC');
    
    foreach ($results as $item) {
        echo "- {$item->product_name} ({$item->size}): {$item->quantity} units, status: {$item->status}\n";
    }
    
    echo "\nItems with quantity <= 10:\n";
    echo "==========================\n";
    
    $lowStock = DB::select('SELECT product_name, size, quantity, status FROM inventory WHERE status = ? AND quantity <= ? ORDER BY quantity ASC', ['available', 10]);
    
    foreach ($lowStock as $item) {
        echo "- {$item->product_name} ({$item->size}): {$item->quantity} units, status: {$item->status}\n";
    }
    
    if (empty($lowStock)) {
        echo "No items found with quantity <= 10 and status = 'available'\n";
    }
    
    echo "\nChecking what status values exist:\n";
    echo "=================================\n";
    
    $statuses = DB::select('SELECT DISTINCT status, COUNT(*) as count FROM inventory GROUP BY status');
    foreach ($statuses as $status) {
        echo "Status: '{$status->status}' - {$status->count} items\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

echo "All Inventory Records:\n";
echo "=====================\n";

$inventoryItems = \App\Models\Inventory::all(['product_name', 'size', 'quantity', 'status']);

foreach ($inventoryItems as $item) {
    echo "- {$item->product_name} ({$item->size}): {$item->quantity} units, status: {$item->status}\n";
}

echo "\nCritical Stock Query (quantity <= 10 AND status = 'available'):\n";
echo "==============================================================\n";

$criticalItems = \App\Models\Inventory::where('status', 'available')
                    ->where('quantity', '<=', 10)
                    ->get(['product_name', 'size', 'quantity', 'status']);

foreach ($criticalItems as $item) {
    echo "- {$item->product_name} ({$item->size}): {$item->quantity} units, status: {$item->status}\n";
}

if ($criticalItems->count() === 0) {
    echo "No critical items found!\n";
}

echo "\nCounting items by status:\n";
echo "========================\n";
$statusCounts = \App\Models\Inventory::selectRaw('status, COUNT(*) as count, SUM(quantity) as total_qty')
    ->groupBy('status')
    ->get();

foreach ($statusCounts as $status) {
    echo "Status '{$status->status}': {$status->count} items, {$status->total_qty} total quantity\n";
}
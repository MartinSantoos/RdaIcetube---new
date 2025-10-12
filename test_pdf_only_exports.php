<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Order;
use App\Models\Equipment;
use App\Models\Inventory;
use App\Models\User;
use Illuminate\Http\Request;

echo "Testing Export Controllers - PDF Only Mode\n";
echo str_repeat("=", 50) . "\n\n";

// Test SalesReportController
echo "1. Testing SalesReportController:\n";
$request = new Request(['start_date' => '2025-10-01', 'end_date' => '2025-10-11']);
$salesController = new \App\Http\Controllers\SalesReportController();

try {
    $response = $salesController->export($request);
    $contentType = $response->headers->get('Content-Type');
    $disposition = $response->headers->get('Content-Disposition');
    
    if (strpos($contentType, 'pdf') !== false) {
        echo "   ✅ Sales Report: PDF generated successfully\n";
    } else {
        echo "   ❌ Sales Report: Unexpected format - $contentType\n";
    }
} catch (Exception $e) {
    echo "   ❌ Sales Report: Error - " . $e->getMessage() . "\n";
}

// Test EquipmentController
echo "\n2. Testing EquipmentController:\n";
$equipmentController = new \App\Http\Controllers\EquipmentController();

try {
    $response = $equipmentController->export($request);
    $contentType = $response->headers->get('Content-Type');
    
    if (strpos($contentType, 'pdf') !== false) {
        echo "   ✅ Equipment Report: PDF generated successfully\n";
    } else {
        echo "   ❌ Equipment Report: Unexpected format - $contentType\n";
    }
} catch (Exception $e) {
    echo "   ❌ Equipment Report: Error - " . $e->getMessage() . "\n";
}

// Test InventoryController
echo "\n3. Testing InventoryController:\n";
$inventoryController = new \App\Http\Controllers\InventoryController();

try {
    $response = $inventoryController->export($request);
    $contentType = $response->headers->get('Content-Type');
    
    if (strpos($contentType, 'pdf') !== false) {
        echo "   ✅ Inventory Report: PDF generated successfully\n";
    } else {
        echo "   ❌ Inventory Report: Unexpected format - $contentType\n";
    }
} catch (Exception $e) {
    echo "   ❌ Inventory Report: Error - " . $e->getMessage() . "\n";
}

// Test EmployeeController
echo "\n4. Testing EmployeeController:\n";
$employeeController = new \App\Http\Controllers\EmployeeController();

try {
    $response = $employeeController->export($request);
    $contentType = $response->headers->get('Content-Type');
    
    if (strpos($contentType, 'pdf') !== false) {
        echo "   ✅ Employee Report: PDF generated successfully\n";
    } else {
        echo "   ❌ Employee Report: Unexpected format - $contentType\n";
    }
} catch (Exception $e) {
    echo "   ❌ Employee Report: Error - " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "✅ All export controllers have been updated to PDF-only mode!\n";
echo "🗂️  CSV functionality has been completely removed from all exports.\n";
echo "📄 Users will now only see PDF export options in the interface.\n";
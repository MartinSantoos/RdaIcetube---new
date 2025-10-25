<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\SalesReportController;
use App\Http\Controllers\SettingsController;

Route::get('/', function () {
    // If user is authenticated, redirect to appropriate dashboard
    if (Auth::check()) {
        $user = Auth::user();
        if ($user->user_type == 1) {
            return redirect()->route('admin.dashboard');
        } else {
            return redirect()->route('employee.dashboard');
        }
    }
    // If not authenticated, redirect to login
    return redirect()->route('login');
})->name('home');

// Very simple test route
Route::get('simple-test', function () {
    return response()->json(['message' => 'Server is working', 'time' => now()]);
})->name('simple.test');

// Test route for stock update
Route::get('test-update/{id}', function ($id) {
    $inventory = \App\Models\Inventory::where('inventory_id', $id)->first();
    if (!$inventory) {
        return response()->json(['error' => 'Item not found'], 404);
    }
    return response()->json([
        'item' => $inventory,
        'update_url' => route('inventory.updateStock', $id),
        'method' => 'PATCH'
    ]);
})->name('test.update');

Route::middleware(['auth'])->group(function () {
    // Admin Dashboard
    Route::get('admin/dashboard', function () {
        $todayOrdersCount = \App\Models\Order::whereDate('created_at', today())->count();
        $thisMonthOrdersCount = \App\Models\Order::whereMonth('created_at', now()->month)
                                                ->whereYear('created_at', now()->year)
                                                ->count();
        $thisYearOrdersCount = \App\Models\Order::whereYear('created_at', now()->year)->count();
        
        // Get inventory statistics (excluding archived items)
        $totalStock = \App\Models\Inventory::where('status', 'available')
                                           ->whereNull('archived_at')
                                           ->sum('quantity');
        $totalItems = \App\Models\Inventory::where('status', 'available')
                                           ->whereNull('archived_at')
                                           ->count();
        
        // Define critical stock threshold (10 units or less, including out of stock, but excluding archived)
        $criticalThreshold = 10;
        $criticalStockItems = \App\Models\Inventory::where('quantity', '<=', $criticalThreshold)
                                                   ->whereNull('archived_at')
                                                   ->get(['product_name', 'size', 'quantity', 'status']);
        
        // Get today's sales data for the chart
        $todaysSales = \App\Models\Order::where('status', 'completed')
                                       ->whereDate('order_date', today())
                                       ->selectRaw('HOUR(created_at) as hour, SUM(total) as sales')
                                       ->groupBy('hour')
                                       ->orderBy('hour')
                                       ->get();
        
        // Calculate total sales for today
        $todaysTotalSales = \App\Models\Order::where('status', 'completed')
                                           ->whereDate('order_date', today())
                                           ->sum('total');
        
        // Create hourly sales data array (0-23 hours)
        $hourlySales = array_fill(0, 24, 0);
        foreach ($todaysSales as $sale) {
            $hourlySales[$sale->hour] = (float) $sale->sales;
        }

        // Get recent activity logs (last 10 activities)
        $recentActivities = \App\Models\ActivityLog::with('user')
                                                  ->orderBy('created_at', 'desc')
                                                  ->limit(10)
                                                  ->get();

        return Inertia::render('admin/dashboard', [
            'user' => Auth::user(),
            'orderStats' => [
                'today' => $todayOrdersCount,
                'thisMonth' => $thisMonthOrdersCount,
                'thisYear' => $thisYearOrdersCount
            ],
            'inventoryStats' => [
                'totalStock' => $totalStock,
                'totalItems' => $totalItems,
                'criticalStockCount' => $criticalStockItems->count(),
                'criticalStockItems' => $criticalStockItems
            ],
            'salesStats' => [
                'totalSales' => $todaysTotalSales,
                'hourlySales' => $hourlySales
            ],
            'recentActivities' => $recentActivities
        ]);
    })->name('admin.dashboard')->middleware('check.admin');

    // API endpoint for activity filtering
    Route::get('api/admin/activities', function (Request $request) {
        $filter = $request->get('filter', 'recent');
        
        $query = \App\Models\ActivityLog::with('user')->orderBy('created_at', 'desc');
        
        switch ($filter) {
            case 'today':
                $query->whereDate('created_at', today());
                break;
            case 'all':
                // No additional filter, get all activities but limit to avoid performance issues
                $query->limit(1000);
                break;
            case 'recent':
            default:
                $query->limit(10);
                break;
        }
        
        $activities = $query->get();
        
        return response()->json(['activities' => $activities]);
    })->middleware('check.admin');

    // Admin Sales Report
    Route::get('admin/sales-report', [SalesReportController::class, 'index'])
        ->name('admin.sales-report')
        ->middleware('check.admin');
    
    // Admin Sales Report Export
    Route::get('admin/sales-report/export', [SalesReportController::class, 'export'])
        ->name('admin.sales-report.export')
        ->middleware('check.admin');

    // Admin Point of Sales
    Route::get('admin/point-of-sales', function () {
        // Get delivery riders
        $deliveryRiders = \App\Models\User::where('user_type', 2)
            ->where('status', 'active')
            ->where(function($query) {
                $query->where('position', 'like', '%delivery%')
                      ->orWhere('position', 'like', '%rider%')
                      ->orWhere('position', 'like', '%driver%');
            })
            ->select('id', 'name', 'position')
            ->get();

        // Get active and archived orders with delivery rider information
        $orders = \App\Models\Order::with('deliveryRider:id,name,position')
            ->where('archived', false)
            ->orderBy('order_date', 'desc')
            ->get();
        $archivedOrders = \App\Models\Order::with('deliveryRider:id,name,position')
            ->where('archived', true)
            ->orderBy('order_date', 'desc')
            ->get();

        // Get inventory items to show available sizes (excluding archived items, including critical stock)
        $inventory = \App\Models\Inventory::select('product_name', 'size', 'price', 'status', 'quantity')
            ->whereNull('archived_at')
            ->whereIn('status', ['available', 'critical'])
            ->orderBy('product_name')
            ->orderBy('size')
            ->get();
        
        return Inertia::render('admin/point-of-sales', [
            'user' => Auth::user(),
            'orders' => $orders,
            'deliveryRiders' => $deliveryRiders,
            'archivedOrders' => $archivedOrders,
            'inventory' => $inventory
        ]);
    })->name('admin.point-of-sales')->middleware('check.admin');

    //archive and restore routes
    Route::patch('admin/orders/{order_id}/archive', [OrderController::class, 'archive'])
        ->name('orders.archive')->middleware('check.admin');

    Route::patch('admin/orders/{order_id}/restore', [OrderController::class, 'restore'])
        ->name('orders.restore')->middleware('check.admin');

    Route::delete('admin/orders/{order_id}/force-delete', [OrderController::class, 'forceDelete'])
        ->name('orders.forceDelete')->middleware('check.admin');

    // Admin Orders
    Route::post('admin/orders', [OrderController::class, 'store'])
        ->name('orders.store')->middleware('check.admin');
    
    Route::patch('admin/orders/{order_id}/status', [OrderController::class, 'updateStatus'])
        ->name('orders.updateStatus')->middleware('check.admin');

    // Receipt Route
    Route::get('admin/orders/{order_id}/receipt', [OrderController::class, 'showReceipt'])
        ->name('orders.receipt')->middleware('check.admin');

    // Admin Inventory 
    Route::get('admin/inventory', [App\Http\Controllers\InventoryController::class, 'index'])
        ->name('admin.inventory')->middleware('check.admin');
        
    Route::get('admin/inventory-new', [App\Http\Controllers\InventoryController::class, 'index'])
        ->name('admin.inventory-new')->middleware('check.admin');
    
    Route::post('admin/inventory', [App\Http\Controllers\InventoryController::class, 'store'])
        ->name('inventory.store')->middleware('check.admin');
        
    Route::patch('admin/inventory/{inventory_id}/update-stock', [App\Http\Controllers\InventoryController::class, 'updateStock'])
        ->name('inventory.updateStock')->middleware('check.admin');
    
    Route::patch('admin/inventory/{inventory_id}/archive', [App\Http\Controllers\InventoryController::class, 'archive'])
        ->name('inventory.archive')->middleware('check.admin');
        
    Route::patch('admin/inventory/{inventory_id}/restore', [App\Http\Controllers\InventoryController::class, 'restore'])
        ->name('inventory.restore')->middleware('check.admin');
    
    Route::delete('admin/inventory/{inventory_id}', [App\Http\Controllers\InventoryController::class, 'destroy'])
        ->name('inventory.destroy')->middleware('check.admin');
    
    Route::get('admin/inventory/export', [App\Http\Controllers\InventoryController::class, 'export'])
        ->name('admin.inventory.export')->middleware('check.admin');

    // Admin Equipment 
    Route::get('admin/equipment', [App\Http\Controllers\EquipmentController::class, 'index'])
        ->name('admin.equipment')->middleware('check.admin');
    
    Route::post('admin/equipment', [App\Http\Controllers\EquipmentController::class, 'store'])
        ->name('equipment.store')->middleware('check.admin');

    Route::post('admin/equipment/maintenance', [App\Http\Controllers\EquipmentController::class, 'scheduleMaintenance'])
        ->name('equipment.scheduleMaintenance')->middleware('check.admin');

    Route::patch('admin/equipment/maintenance/{id}/complete', [App\Http\Controllers\EquipmentController::class, 'completeMaintenance'])
        ->name('equipment.completeMaintenance')->middleware('check.admin');

    Route::post('admin/equipment/{id}/mark-operational', [App\Http\Controllers\EquipmentController::class, 'markAsOperational'])
        ->name('equipment.markAsOperational')->middleware('check.admin');

    Route::post('admin/equipment/{id}/mark-broken', [App\Http\Controllers\EquipmentController::class, 'markAsBroken'])
        ->name('equipment.markAsBroken')->middleware('check.admin');

    // Equipment API for dashboard
    Route::get('api/admin/equipment/dashboard-stats', [App\Http\Controllers\EquipmentController::class, 'getDashboardStats'])
        ->name('equipment.dashboardStats')->middleware('check.admin');
    
    // Sales API for dashboard
    Route::get('api/admin/sales/dashboard-stats', [App\Http\Controllers\SalesReportController::class, 'dashboardStats'])
        ->name('sales.dashboardStats')->middleware('check.admin');

    // Equipment Export
    Route::get('admin/equipment/export', [App\Http\Controllers\EquipmentController::class, 'export'])
        ->name('admin.equipment.export')->middleware('check.admin');

    // Admin Employees
    Route::get('admin/employees', [App\Http\Controllers\EmployeeController::class, 'index'])
        ->name('admin.employees')->middleware('check.admin');
    
    Route::post('admin/employees', [App\Http\Controllers\EmployeeController::class, 'store'])
        ->name('employees.store')->middleware('check.admin');
        
    Route::put('admin/employees/{id}', [App\Http\Controllers\EmployeeController::class, 'update'])
        ->name('employees.update')->middleware('check.admin');
        
    Route::delete('admin/employees/{id}', [App\Http\Controllers\EmployeeController::class, 'destroy'])
        ->name('employees.destroy')->middleware('check.admin');
        
    Route::patch('admin/employees/{id}/toggle-status', [App\Http\Controllers\EmployeeController::class, 'toggleStatus'])
        ->name('employees.toggleStatus')->middleware('check.admin');

    Route::patch('admin/employees/{id}/archive', [App\Http\Controllers\EmployeeController::class, 'archive'])
        ->name('employees.archive')->middleware('check.admin');

    Route::patch('admin/employees/{id}/reset-password', [App\Http\Controllers\EmployeeController::class, 'resetPassword'])
        ->name('employees.resetPassword')->middleware('check.admin');
    
    Route::get('admin/employees/export', [App\Http\Controllers\EmployeeController::class, 'export'])
        ->name('admin.employees.export')->middleware('check.admin');

    // Archived Employees Routes
    Route::get('admin/employees/archived', [App\Http\Controllers\EmployeeController::class, 'archived'])
        ->name('employees.archived')->middleware('check.admin');
        
    Route::patch('admin/employees/{id}/restore', [App\Http\Controllers\EmployeeController::class, 'restore'])
        ->name('employees.restore')->middleware('check.admin');
        
    Route::delete('admin/employees/{id}/force-delete', [App\Http\Controllers\EmployeeController::class, 'forceDelete'])
        ->name('employees.forceDelete')->middleware('check.admin');

    // Admin Settings
    Route::get('admin/settings', [SettingsController::class, 'index'])
        ->name('admin.settings')->middleware('check.admin');
    
    Route::patch('admin/settings/password', [SettingsController::class, 'updatePassword'])
        ->name('admin.settings.password')->middleware('check.admin');
    
    Route::patch('admin/settings/profile', [SettingsController::class, 'updateProfile'])
        ->name('admin.settings.profile')->middleware('check.admin');

    // Employee Dashboard
    Route::get('employee/dashboard', function () {
        $user = Auth::user();
        
        // Get all orders assigned to this employee for stats (exclude archived orders)
        $orders = \App\Models\Order::where('delivery_rider_id', $user->id)
            ->where('archived', false)
            ->get();
        
        // Calculate stats
        $totalOrders = $orders->count();
        $completedOrders = $orders->where('status', 'completed')->count();
        $pendingOrders = $orders->where('status', 'pending')->count();
        $onDeliveryOrders = $orders->where('status', 'out_for_delivery')->count();
        
        // Get orders due today (orders with delivery_date = today that are not completed and not archived)
        // Use database query for proper date filtering
        $dueTodayOrders = \App\Models\Order::where('delivery_rider_id', $user->id)
            ->where('archived', false) // Exclude archived orders
            ->whereIn('status', ['pending', 'out_for_delivery'])
            ->whereDate('delivery_date', now()->toDateString())
            ->orderBy('delivery_date', 'asc')
            ->take(10)
            ->get();
            
        // Get recent orders (latest 5, exclude archived)
        $recentOrders = \App\Models\Order::where('delivery_rider_id', $user->id)
            ->where('archived', false) // Exclude archived orders
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
        
        return Inertia::render('employee/dashboard', [
            'user' => $user,
            'stats' => [
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'pending_orders' => $pendingOrders,
                'on_delivery_orders' => $onDeliveryOrders,
            ],
            'due_today_orders' => $dueTodayOrders,
            'recent_orders' => $recentOrders,
        ]);
    })->name('employee.dashboard')->middleware('check.employee');

    // Employee Orders
    Route::get('employee/orders', [App\Http\Controllers\OrderController::class, 'employeeIndex'])
        ->name('employee.orders')->middleware('check.employee');

    Route::post('employee/orders', [App\Http\Controllers\OrderController::class, 'employeeStore'])
        ->name('employee.orders.store')->middleware('check.employee');

    Route::post('employee/orders/{order}/update-status', [App\Http\Controllers\OrderController::class, 'employeeUpdateStatus'])
        ->name('employee.orders.update-status')->middleware('check.employee');

    Route::post('employee/orders/{order}/complete-with-photo', [App\Http\Controllers\OrderController::class, 'completeOrderWithPhoto'])
        ->name('employee.orders.complete-with-photo')->middleware('check.employee');

    // Employee Settings
    Route::get('employee/settings', [SettingsController::class, 'index'])
        ->name('employee.settings')->middleware('check.employee');
    
    Route::patch('employee/settings/password', [SettingsController::class, 'updatePassword'])
        ->name('employee.settings.password')->middleware('check.employee');
    
    Route::patch('employee/settings/profile', [SettingsController::class, 'updateProfile'])
        ->name('employee.settings.profile')->middleware('check.employee');
});

// Admin Product Monitoring (Public Access for Display Screens - No Authentication Required)
Route::get('admin/product-monitoring', function () {
    // Allow access without authentication for monitoring displays
    $user = Auth::user() ?: (object)[
        'id' => 0,
        'name' => 'Monitoring Display',
        'user_type' => 1
    ];
    
    // Get today's completed orders (orders completed today, not ordered today)
    $today = Carbon::today();
    $totalSoldToday = \App\Models\Order::where('status', 'completed')
        ->whereDate('updated_at', $today)
        ->sum('quantity');
    
    // Get production data by size for today's completed orders
    $completedOrdersBySize = \App\Models\Order::where('status', 'completed')
        ->whereDate('updated_at', $today)
        ->selectRaw('size, SUM(quantity) as total_quantity')
        ->groupBy('size')
        ->get();
    
    // Get available inventory sizes to only show products that exist
    $availableInventorySizes = \App\Models\Inventory::pluck('size')->toArray();
    
    // Create production data array only for inventory sizes
    $productionData = [];
    
    foreach ($availableInventorySizes as $size) {
        $sizeData = $completedOrdersBySize->firstWhere('size', $size);
        $productionData[] = [
            'size' => ucwords($size) . ' Ice',
            'quantity' => $sizeData ? (int)$sizeData->total_quantity : 0
        ];
    }
    
    // Get order queue data with actual order IDs and delivery information
    $pendingOrdersData = \App\Models\Order::where('status', 'pending')
        ->with('deliveryRider:id,name')
        ->get(['order_id', 'delivery_mode', 'delivery_rider_id']);
    $onDeliveryOrdersData = \App\Models\Order::where('status', 'out_for_delivery')
        ->with('deliveryRider:id,name')
        ->get(['order_id', 'delivery_mode', 'delivery_rider_id']);
    
    $pendingOrders = $pendingOrdersData->count();
    $onDeliveryOrders = $onDeliveryOrdersData->count();
    $totalQueueOrders = $pendingOrders + $onDeliveryOrders;
    
    // Extract order IDs and delivery information
    $pendingOrderInfo = $pendingOrdersData->map(function ($order) {
        return [
            'order_id' => $order->order_id,
            'delivery_mode' => $order->delivery_mode,
            'delivery_rider' => $order->deliveryRider ? $order->deliveryRider->name : null
        ];
    })->toArray();
    
    $onDeliveryOrderInfo = $onDeliveryOrdersData->map(function ($order) {
        return [
            'order_id' => $order->order_id,
            'delivery_mode' => $order->delivery_mode,
            'delivery_rider' => $order->deliveryRider ? $order->deliveryRider->name : null
        ];
    })->toArray();
    
    return Inertia::render('admin/product-monitoring', [
        'user' => $user,
        'monitoring' => [
            'totalSoldToday' => $totalSoldToday,
            'productionData' => $productionData,
            'orderQueue' => [
                'totalQueue' => $totalQueueOrders,
                'pending' => $pendingOrders,
                'onDelivery' => $onDeliveryOrders,
                'pendingOrderInfo' => $pendingOrderInfo,
                'onDeliveryOrderInfo' => $onDeliveryOrderInfo
            ]
        ]
    ]);
})->name('admin.product-monitoring');

// Debug route for testing order prices
Route::get('/test-fix-prices', function () {
    echo "<h1>Fixing Order Prices</h1>";
    
    $orders = \App\Models\Order::where('status', 'completed')->whereNull('price')->get();
    
    echo "<p>Found " . $orders->count() . " completed orders without price.</p>";
    
    foreach ($orders as $order) {
        // Get the price from inventory based on size
        $inventory = \App\Models\Inventory::where('size', $order->size)->first();
        
        if ($inventory) {
            $price = $inventory->price;
            $total = $price * $order->quantity;
            
            $order->update([
                'price' => $price,
                'total' => $total
            ]);
            
            echo "<p>Updated Order {$order->order_id}: price = {$price}, total = {$total}</p>";
        } else {
            echo "<p>No inventory found for Order {$order->order_id} with size {$order->size}</p>";
        }
    }
    
    echo "<h2>Current Completed Orders:</h2>";
    $completedOrders = \App\Models\Order::where('status', 'completed')->get(['order_id', 'price', 'total', 'size', 'quantity']);
    
    echo "<table border='1'>";
    echo "<tr><th>Order ID</th><th>Size</th><th>Quantity</th><th>Price</th><th>Total</th></tr>";
    
    foreach ($completedOrders as $order) {
        echo "<tr>";
        echo "<td>{$order->order_id}</td>";
        echo "<td>{$order->size}</td>";
        echo "<td>{$order->quantity}</td>";
        echo "<td>" . ($order->price ?? 'NULL') . "</td>";
        echo "<td>" . ($order->total ?? 'NULL') . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
    return "Done!";
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

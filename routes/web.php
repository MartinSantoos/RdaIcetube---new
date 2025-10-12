<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
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
        
        // Get inventory statistics
        $totalStock = \App\Models\Inventory::where('status', 'available')->sum('quantity');
        $totalItems = \App\Models\Inventory::where('status', 'available')->count();
        
        // Define critical stock threshold (10 units or less, including out of stock)
        $criticalThreshold = 10;
        $criticalStockItems = \App\Models\Inventory::where('quantity', '<=', $criticalThreshold)
                                                   ->get(['product_name', 'size', 'quantity', 'status']);
        
        // Get today's sales data for the chart
        $todaysSales = \App\Models\Order::where('status', 'completed')
                                       ->whereDate('created_at', today())
                                       ->selectRaw('HOUR(created_at) as hour, SUM(total) as sales')
                                       ->groupBy('hour')
                                       ->orderBy('hour')
                                       ->get();
        
        // Calculate total sales for today
        $todaysTotalSales = \App\Models\Order::where('status', 'completed')
                                           ->whereDate('created_at', today())
                                           ->sum('total');
        
        // Create hourly sales data array (0-23 hours)
        $hourlySales = array_fill(0, 24, 0);
        foreach ($todaysSales as $sale) {
            $hourlySales[$sale->hour] = (float) $sale->sales;
        }
        
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
                'todayTotal' => $todaysTotalSales,
                'hourlySales' => $hourlySales
            ]
        ]);
    })->name('admin.dashboard')->middleware('check.admin');

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

        // Get active and archived orders
        $orders = \App\Models\Order::where('archived', false)->orderBy('order_date', 'desc')->get();
        $archivedOrders = \App\Models\Order::where('archived', true)->orderBy('order_date', 'desc')->get();

        // Get inventory items to show available sizes
        $inventory = \App\Models\Inventory::select('size', 'price', 'status', 'quantity')
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
    
    Route::post('admin/inventory', [App\Http\Controllers\InventoryController::class, 'store'])
        ->name('inventory.store')->middleware('check.admin');
        
    Route::patch('admin/inventory/{inventory_id}/update-stock', [App\Http\Controllers\InventoryController::class, 'updateStock'])
        ->name('inventory.updateStock')->middleware('check.admin');
    
    Route::get('admin/inventory/export', [App\Http\Controllers\InventoryController::class, 'export'])
        ->name('admin.inventory.export')->middleware('check.admin');

    // Admin Equipment 
    Route::get('admin/equipment', [App\Http\Controllers\EquipmentController::class, 'index'])
        ->name('admin.equipment')->middleware('check.admin');
    
    Route::post('admin/equipment', [App\Http\Controllers\EquipmentController::class, 'store'])
        ->name('equipment.store')->middleware('check.admin');

    Route::post('admin/equipment/maintenance', [App\Http\Controllers\EquipmentController::class, 'scheduleMaintenance'])
        ->name('equipment.scheduleMaintenance')->middleware('check.admin');

    Route::post('admin/equipment/{id}/mark-operational', [App\Http\Controllers\EquipmentController::class, 'markAsOperational'])
        ->name('equipment.markAsOperational')->middleware('check.admin');

    // Equipment API for dashboard
    Route::get('api/admin/equipment/dashboard-stats', [App\Http\Controllers\EquipmentController::class, 'getDashboardStats'])
        ->name('equipment.dashboardStats')->middleware('check.admin');

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
        
        // Get orders assigned to this employee
        $orders = \App\Models\Order::where('delivery_rider_id', $user->id)->get();
        
        // Calculate stats
        $totalOrders = $orders->count();
        $completedOrders = $orders->where('status', 'completed')->count();
        $pendingOrders = $orders->where('status', 'pending')->count();
        $onDeliveryOrders = $orders->where('status', 'out_for_delivery')->count();
        
        // Get orders due today (orders with delivery_date = today that are not completed or cancelled)
        $dueTodayOrders = $orders->whereIn('status', ['pending', 'out_for_delivery'])
            ->where('delivery_date', now()->toDateString())
            ->take(5);
            
        // Get recent orders (latest 5)
        $recentOrders = $orders->sortByDesc('created_at')->take(5);
        
        return Inertia::render('employee/dashboard', [
            'user' => $user,
            'stats' => [
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'pending_orders' => $pendingOrders,
                'on_delivery_orders' => $onDeliveryOrders,
            ],
            'due_today_orders' => $dueTodayOrders->values(),
            'recent_orders' => $recentOrders->values(),
        ]);
    })->name('employee.dashboard')->middleware('check.employee');

    // Employee Orders
    Route::get('employee/orders', [App\Http\Controllers\OrderController::class, 'employeeIndex'])
        ->name('employee.orders')->middleware('check.employee');

    Route::post('employee/orders/{order}/update-status', [App\Http\Controllers\OrderController::class, 'employeeUpdateStatus'])
        ->name('employee.orders.update-status')->middleware('check.employee');

    // Employee Settings
    Route::get('employee/settings', [SettingsController::class, 'index'])
        ->name('employee.settings')->middleware('check.employee');
    
    Route::patch('employee/settings/password', [SettingsController::class, 'updatePassword'])
        ->name('employee.settings.password')->middleware('check.employee');
    
    Route::patch('employee/settings/profile', [SettingsController::class, 'updateProfile'])
        ->name('employee.settings.profile')->middleware('check.employee');
});

// Debug route for testing order prices


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\ActivityLog;
use App\Models\JobOrder;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class InventoryController extends Controller
{
    /**
     * Display the inventory page with all inventory items
     */
    public function index()
    {
        try {
            \Log::info('=== INVENTORY INDEX START ===');
            \Log::info('Request URL: ' . request()->fullUrl());
            \Log::info('Request method: ' . request()->method());
            
            $user = auth()->user();
            \Log::info('User authenticated: ' . ($user ? 'Yes' : 'No'));
            if ($user) {
                \Log::info('User details: ' . json_encode($user->toArray()));
            }
            
            // Get active inventory items (not archived)
            $inventory = Inventory::whereNull('archived_at')->orderBy('inventory_id', 'desc')->get();
            \Log::info('Active inventory items count: ' . $inventory->count());
            
            // Get archived inventory items
            $archivedInventory = Inventory::whereNotNull('archived_at')->orderBy('archived_at', 'desc')->get();
            \Log::info('Archived inventory items count: ' . $archivedInventory->count());
            
            // Get job orders with related data
            $jobOrders = JobOrder::with(['creator:id,name,username', 'assignedUser:id,name,username'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            // Get all employees for job order assignment
            $employees = User::where('user_type', 2)->get(['id', 'name']);
            
            // Get available inventory products for job order creation
            $inventoryProducts = Inventory::whereNull('archived_at')
                ->select('product_name', 'size')
                ->get()
                ->groupBy('product_name')
                ->map(function ($items, $productName) {
                    return [
                        'product_name' => $productName,
                        'sizes' => $items->pluck('size')->toArray()
                    ];
                })
                ->values();
            
            \Log::info('About to render inventory-working component');
            
            $response = Inertia::render('admin/inventory-new', [
                'user' => $user,
                'inventory' => $inventory,
                'archivedInventory' => $archivedInventory,
                'jobOrders' => $jobOrders,
                'employees' => $employees,
                'inventoryProducts' => $inventoryProducts
            ]);
            
            \Log::info('Inertia response created successfully');
            \Log::info('=== INVENTORY INDEX END ===');
            
            return $response;
        } catch (\Exception $e) {
            \Log::error('Inventory index error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            // Return with empty inventory if there's an error
            return Inertia::render('admin/inventory-test', [
                'user' => auth()->user(),
                'inventory' => [],
                'archivedInventory' => [],
                'jobOrders' => [],
                'employees' => [],
                'inventoryProducts' => []
            ]);
        }
    }

    /**
     * Store a new inventory item
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string|max:100',
            'size' => 'required|string|max:100',
            'price' => 'required|numeric|min:0'
        ]);

        // Check if an inventory item with the same product name and size combination already exists
        $existingItem = Inventory::where('product_name', $request->product_name)
                                ->where('size', $request->size)
                                ->first();
        
        if ($existingItem) {
            return redirect()->back()->withErrors([
                'size' => 'A product with the name "' . $request->product_name . '" and size "' . $request->size . '" already exists in the inventory. Please choose a different product name or size combination.'
            ])->withInput();
        }

        // Initialize with 0 quantity - stock will be added through job order completion
        $quantity = 0;
        $status = 'out_of_stock'; // Start as out of stock since no production has occurred yet

        $inventory = Inventory::create([
            'product_name' => $request->product_name,
            'size' => $request->size,
            'price' => $request->price,
            'quantity' => $quantity,
            'status' => $status,
            'date_created' => Carbon::now()->format('Y-m-d')
            
        ]);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'inventory_created',
                "Created new product: {$request->product_name} ({$request->size}) at ₱{$request->price} - Stock will be updated through job order completion",
                $inventory,
                [
                    'product_name' => $request->product_name,
                    'size' => $request->size,
                    'price' => $request->price,
                    'quantity' => $quantity,
                    'status' => $status
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Product created successfully! Stock will be updated when job orders are completed.');
    }

    /**
     * Store a new job order
     */
    public function storeJobOrder(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string|max:100',
            'size' => 'required|string|max:100',
            'quantity_to_produce' => 'required|integer|min:1',
            'production_date' => 'required|date|after_or_equal:today',
            'assigned_to' => 'nullable|exists:users,id',
            'notes' => 'nullable|string|max:500'
        ]);

        // Verify the product exists in inventory
        $inventory = Inventory::where('product_name', $request->product_name)
                             ->where('size', $request->size)
                             ->whereNull('archived_at')
                             ->first();

        if (!$inventory) {
            return redirect()->back()->withErrors([
                'product_name' => 'The selected product and size combination does not exist in inventory.'
            ]);
        }

        $userId = (int) auth()->user()->id;
        
        // If no employee is assigned, automatically assign one with no pending job orders
        $assignedTo = $request->assigned_to;
        if (!$assignedTo) {
            // Find employees who don't have any pending job orders
            $availableEmployee = User::where('user_type', 2) // employees
                ->whereNotExists(function($query) {
                    $query->select('*')
                          ->from('job_orders')
                          ->whereRaw('job_orders.assigned_to = users.id')
                          ->where('status', 'pending');
                })
                ->first();
            
            if ($availableEmployee) {
                $assignedTo = $availableEmployee->id;
            } else {
                // If no available employee found, assign to any employee (round-robin style)
                $anyEmployee = User::where('user_type', 2)->first();
                if ($anyEmployee) {
                    $assignedTo = $anyEmployee->id;
                }
            }
        }
        
        $jobOrder = JobOrder::create([
            'job_order_number' => JobOrder::generateJobOrderNumber(),
            'product_name' => $request->product_name,
            'size' => $request->size,
            'quantity_to_produce' => $request->quantity_to_produce,
            'production_date' => $request->production_date,
            'created_by' => $userId,
            'assigned_to' => $assignedTo,
            'notes' => $request->notes,
            'status' => 'pending'
        ]);

        // Prepare activity log message and data
        $logMessage = "Created job order {$jobOrder->job_order_number} for {$request->quantity_to_produce} units of {$request->product_name} ({$request->size})";
        $logData = [
            'job_order_number' => $jobOrder->job_order_number,
            'product_name' => $request->product_name,
            'size' => $request->size,
            'quantity_to_produce' => $request->quantity_to_produce,
            'production_date' => $request->production_date
        ];

        // Add assignment information to log
        if ($assignedTo) {
            $assignedUser = User::find($assignedTo);
            if ($assignedUser) {
                if (!$request->assigned_to) {
                    // Employee was automatically assigned
                    $logMessage .= " - Automatically assigned to {$assignedUser->name}";
                    $logData['auto_assigned'] = true;
                    $logData['assigned_employee'] = $assignedUser->name;
                } else {
                    // Employee was manually selected
                    $logData['assigned_employee'] = $assignedUser->name;
                }
            }
        }

        // Log the activity
        ActivityLog::log(
            'job_order_created',
            $logMessage,
            $jobOrder,
            $logData,
            $userId
        );

        return redirect()->back()->with('success', 'Job order created successfully!');
    }

    /**
     * Update job order status
     */
    public function updateJobOrderStatus(Request $request, $jobOrderId)
    {
        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'cancellation_reason' => 'required_if:status,cancelled|nullable|string|max:500'
        ]);

        $jobOrder = JobOrder::findOrFail($jobOrderId);
        $oldStatus = $jobOrder->status;

        // Handle status transitions
        $updates = ['status' => $request->status];

        if ($request->status === 'in_progress' && $oldStatus === 'pending') {
            $updates['started_at'] = now();
        } elseif ($request->status === 'completed' && $oldStatus === 'in_progress') {
            $updates['completed_at'] = now();
            
            // Add stock to inventory when job order is completed
            $this->addStockToInventory($jobOrder);
        } elseif ($request->status === 'cancelled') {
            $updates['cancelled_at'] = now();
            $updates['cancellation_reason'] = $request->cancellation_reason;
        }

        $jobOrder->update($updates);

        // Log the activity
        $activityData = [
            'old_status' => $oldStatus,
            'new_status' => $request->status,
            'product_name' => $jobOrder->product_name,
            'size' => $jobOrder->size,
            'quantity_produced' => $jobOrder->quantity_to_produce
        ];

        if ($request->status === 'cancelled') {
            $activityData['cancellation_reason'] = $request->cancellation_reason;
        }

        ActivityLog::log(
            'job_order_status_updated',
            $request->status === 'cancelled' 
                ? "Cancelled job order {$jobOrder->job_order_number}: {$request->cancellation_reason}"
                : "Updated job order {$jobOrder->job_order_number} status from '{$oldStatus}' to '{$request->status}'",
            $jobOrder,
            $activityData,
            (int) auth()->user()->id
        );

        return redirect()->back()->with('success', 'Job order status updated successfully!');
    }

    /**
     * Add produced stock to inventory when job order is completed
     */
    private function addStockToInventory(JobOrder $jobOrder)
    {
        $inventory = Inventory::where('product_name', $jobOrder->product_name)
                             ->where('size', $jobOrder->size)
                             ->whereNull('archived_at')
                             ->first();

        if ($inventory) {
            $oldQuantity = $inventory->quantity;
            $newQuantity = $oldQuantity + $jobOrder->quantity_to_produce;

            // Update quantity and status
            $status = 'available';
            if ($newQuantity <= 10) {
                $status = 'critical';
            }

            $inventory->update([
                'quantity' => $newQuantity,
                'status' => $status
            ]);

            // Log the inventory update
            ActivityLog::log(
                'inventory_updated_from_production',
                "Added {$jobOrder->quantity_to_produce} units to {$inventory->product_name} ({$inventory->size}) from job order {$jobOrder->job_order_number}. Stock: {$oldQuantity} → {$newQuantity}",
                $inventory,
                [
                    'job_order_id' => $jobOrder->job_order_id,
                    'job_order_number' => $jobOrder->job_order_number,
                    'product_name' => $inventory->product_name,
                    'size' => $inventory->size,
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $newQuantity,
                    'quantity_added' => $jobOrder->quantity_to_produce
                ],
                (int) auth()->user()->id
            );
        }
    }

    /**
     * Delete a job order
     */
    public function destroyJobOrder($jobOrderId)
    {
        $jobOrder = JobOrder::findOrFail($jobOrderId);

        // Only allow deletion of pending job orders
        if ($jobOrder->status !== 'pending') {
            return redirect()->back()->withErrors([
                'error' => 'Only pending job orders can be deleted.'
            ]);
        }

        // Log the deletion before deleting
        ActivityLog::log(
            'job_order_deleted',
            "Deleted job order {$jobOrder->job_order_number} for {$jobOrder->product_name} ({$jobOrder->size})",
            $jobOrder,
            [
                'job_order_number' => $jobOrder->job_order_number,
                'product_name' => $jobOrder->product_name,
                'size' => $jobOrder->size,
                'quantity_to_produce' => $jobOrder->quantity_to_produce
            ],
            (int) auth()->user()->id
        );

        $jobOrder->delete();

        return redirect()->back()->with('success', 'Job order deleted successfully!');
    }

    /**
     * Export inventory data as CSV or PDF
     */
    public function export(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        // Get inventory data within date range (using date_created)
        $query = Inventory::orderBy('date_created', 'desc');
        
        if ($startDate && $endDate) {
            $query->whereBetween('date_created', [$startDate, $endDate]);
        }
        
        $inventory = $query->get();

        // Generate PDF report directly
        return $this->generateInventoryPdf($inventory, $startDate, $endDate);
    }



    private function generateInventoryPdf($inventory, $startDate, $endDate)
    {
        $filename = 'inventory_report_' . date('Y-m-d_H-i-s') . '.pdf';
        
        $totalItems = $inventory->count();
        $totalValue = $inventory->sum(function($item) {
            return (float)$item->price * (int)$item->quantity;
        });
        $lowStockItems = $inventory->where('quantity', '<', 10)->count();
        
        $pdf = Pdf::loadView('exports.inventory-pdf', [
            'inventory' => $inventory,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalItems' => $totalItems,
            'totalValue' => $totalValue,
            'lowStockItems' => $lowStockItems,
            'generatedAt' => now()->format('F j, Y \a\t g:i A')
        ]);

        return $pdf->download($filename);
    }

    /**
     * Archive an inventory item
     */
    public function archive($inventory_id)
    {
        try {
            $inventory = Inventory::where('inventory_id', $inventory_id)->firstOrFail();
            
            // Update the archived_at timestamp
            $inventory->update([
                'archived_at' => now()
            ]);
            
            // Log the archive activity
            if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
                ActivityLog::log(
                    'inventory_archived',
                    "Archived inventory item: {$inventory->product_name} ({$inventory->size})",
                    $inventory,
                    [
                        'product_name' => $inventory->product_name,
                        'size' => $inventory->size,
                        'quantity' => $inventory->quantity,
                        'price' => $inventory->price
                    ],
                    auth()->user()->id
                );
            }
            
            return redirect()->back()->with('success', 'Inventory item archived successfully');
        } catch (\Exception $e) {
            Log::error('Error archiving inventory: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to archive inventory item');
        }
    }

    /**
     * Restore an archived inventory item
     */
    public function restore($inventory_id)
    {
        try {
            $inventory = Inventory::where('inventory_id', $inventory_id)->firstOrFail();
            
            // Remove the archived_at timestamp
            $inventory->update([
                'archived_at' => null
            ]);
            
            // Log the restore activity
            if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
                ActivityLog::log(
                    'inventory_restored',
                    "Restored inventory item: {$inventory->product_name} ({$inventory->size})",
                    $inventory,
                    [
                        'product_name' => $inventory->product_name,
                        'size' => $inventory->size,
                        'quantity' => $inventory->quantity,
                        'price' => $inventory->price
                    ],
                    auth()->user()->id
                );
            }
            
            return redirect()->back()->with('success', 'Inventory item restored successfully');
        } catch (\Exception $e) {
            Log::error('Error restoring inventory: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to restore inventory item');
        }
    }

    /**
     * Delete an inventory item
     */
    public function destroy($inventory_id)
    {
        try {
            $inventory = Inventory::where('inventory_id', $inventory_id)->firstOrFail();
            
            // Log the deletion activity before deletion
            if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
                ActivityLog::log(
                    'inventory_deleted',
                    "Deleted inventory item: {$inventory->product_name} ({$inventory->size})",
                    $inventory,
                    [
                        'product_name' => $inventory->product_name,
                        'size' => $inventory->size,
                        'quantity' => $inventory->quantity,
                        'price' => $inventory->price
                    ],
                    auth()->user()->id
                );
            }
            
            $inventory->delete();
            
            return redirect()->back()->with('success', 'Inventory item deleted successfully');
        } catch (\Exception $e) {
            Log::error('Error deleting inventory: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete inventory item');
        }
    }

    /**
     * Deduct stock from inventory with reason
     */
    public function deductStock(Request $request, $inventory_id)
    {
        try {
            $request->validate([
                'quantity' => 'required|integer|min:1',
                'reason' => 'required|string|max:255',
            ]);

            $inventory = Inventory::findOrFail($inventory_id);
            
            // Check if enough stock is available
            if ($inventory->quantity < $request->quantity) {
                return redirect()->back()->with('error', 'Insufficient stock. Only ' . $inventory->quantity . ' units available.');
            }

            $previousQuantity = $inventory->quantity;
            $newQuantity = $previousQuantity - $request->quantity;
            
            // Update the inventory quantity
            $inventory->quantity = $newQuantity;
            
            // Update status based on new quantity
            if ($newQuantity <= 0) {
                $inventory->status = 'out_of_stock';
            } elseif ($newQuantity <= 10) {
                $inventory->status = 'critical';
            } else {
                $inventory->status = 'available';
            }
            
            $inventory->save();

            // Log the stock deduction activity
            if (auth()->check()) {
                ActivityLog::log(
                    'stock_deduction',
                    "Deducted {$request->quantity} units from {$inventory->product_name} ({$inventory->size}) - Reason: {$request->reason}",
                    $inventory,
                    [
                        'previous_quantity' => $previousQuantity,
                        'deducted_quantity' => $request->quantity,
                        'new_quantity' => $newQuantity,
                        'reason' => $request->reason,
                        'product_name' => $inventory->product_name,
                        'size' => $inventory->size
                    ],
                    auth()->user()->id
                );
            }

            return redirect()->back()->with('success', "Successfully deducted {$request->quantity} units from {$inventory->product_name} ({$inventory->size})");
        } catch (\Exception $e) {
            Log::error('Error deducting stock: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to deduct stock. Please try again.');
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\ActivityLog;
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
            
            \Log::info('About to render inventory-working component');
            
            $response = Inertia::render('admin/inventory-new', [
                'user' => $user,
                'inventory' => $inventory,
                'archivedInventory' => $archivedInventory
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
                'archivedInventory' => []
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
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0'
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

        // Determine status based on quantity
        $status = 'available';
        if ($request->quantity == 0) {
            $status = 'out_of_stock';
        } elseif ($request->quantity <= 10) {
            $status = 'critical';
        }

        $inventory = Inventory::create([
            'product_name' => $request->product_name,
            'size' => $request->size,
            'price' => $request->price,
            'quantity' => $request->quantity,
            'status' => $status,
            'date_created' => Carbon::now()->format('Y-m-d')
            
        ]);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'inventory_created',
                "Added new inventory item: {$request->product_name} ({$request->size}) - {$request->quantity} units at ₱{$request->price}",
                $inventory,
                [
                    'product_name' => $request->product_name,
                    'size' => $request->size,
                    'price' => $request->price,
                    'quantity' => $request->quantity,
                    'status' => $status
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Inventory item added successfully!');
    }

    /**
     * Update stock quantity and price for an inventory item
     */
    public function updateStock(Request $request, $inventory_id)
    {
        Log::info('Stock update requested for inventory ID: ' . $inventory_id);
        
        $request->validate([
            'operation' => 'required_with:quantity|in:Add,Subtract',
            'quantity' => 'nullable|integer|min:1',
            'price' => 'required|numeric|min:0'
        ]);

        $inventory = Inventory::where('inventory_id', $inventory_id)->firstOrFail();
        
        $currentStock = $inventory->quantity;
        $currentPrice = $inventory->price;
        $newQuantity = $currentStock; // Default to current quantity
        
        // Only process quantity change if quantity is provided
        if ($request->filled('quantity')) {
            $changeQuantity = $request->quantity;
            
            if ($request->operation === 'Add') {
                $newQuantity = $currentStock + $changeQuantity;
            } else {
                $newQuantity = $currentStock - $changeQuantity;
                if ($newQuantity < 0) {
                    return redirect()->back()->withErrors(['quantity' => 'Cannot subtract more than current stock quantity.']);
                }
            }
        }

        // Determine new status based on quantity
        $status = 'available';
        if ($newQuantity == 0) {
            $status = 'out_of_stock';
        } elseif ($newQuantity <= 10) {
            $status = 'critical';
        }

        Log::info('Updating inventory: old quantity=' . $currentStock . ', new quantity=' . $newQuantity . ', old price=' . $inventory->price . ', new price=' . $request->price . ', new status=' . $status);

        $inventory->update([
            'quantity' => $newQuantity,
            'price' => $request->price,
            'status' => $status
        ]);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            $quantityChanged = $newQuantity != $currentStock;
            $priceChanged = $currentPrice != $request->price;
            
            if ($quantityChanged && $priceChanged) {
                $quantityChange = $newQuantity - $currentStock;
                $quantityText = $quantityChange > 0 ? "+{$quantityChange}" : "{$quantityChange}";
                ActivityLog::log(
                    'inventory_updated',
                    "Updated {$inventory->product_name} ({$inventory->size}): Stock {$quantityText} ({$currentStock} → {$newQuantity}), Price ₱{$currentPrice} → ₱{$request->price}",
                    $inventory,
                    [
                        'product_name' => $inventory->product_name,
                        'size' => $inventory->size,
                        'old_quantity' => $currentStock,
                        'new_quantity' => $newQuantity,
                        'old_price' => $currentPrice,
                        'new_price' => $request->price,
                        'old_status' => $inventory->getOriginal('status'),
                        'new_status' => $status
                    ],
                    auth()->user()->id
                );
            } elseif ($quantityChanged) {
                $quantityChange = $newQuantity - $currentStock;
                $quantityText = $quantityChange > 0 ? "+{$quantityChange}" : "{$quantityChange}";
                ActivityLog::log(
                    'inventory_stock_updated',
                    "Updated stock for {$inventory->product_name} ({$inventory->size}): {$quantityText} units ({$currentStock} → {$newQuantity})",
                    $inventory,
                    [
                        'product_name' => $inventory->product_name,
                        'size' => $inventory->size,
                        'old_quantity' => $currentStock,
                        'new_quantity' => $newQuantity,
                        'quantity_change' => $quantityChange
                    ],
                    auth()->user()->id
                );
            } elseif ($priceChanged) {
                ActivityLog::log(
                    'inventory_price_updated',
                    "Updated price for {$inventory->product_name} ({$inventory->size}): ₱{$currentPrice} → ₱{$request->price}",
                    $inventory,
                    [
                        'product_name' => $inventory->product_name,
                        'size' => $inventory->size,
                        'old_price' => $currentPrice,
                        'new_price' => $request->price
                    ],
                    auth()->user()->id
                );
            }
        }

        $quantityChanged = $newQuantity != $currentStock;
        $message = 'Inventory updated successfully!';
        
        if ($quantityChanged && $request->filled('quantity')) {
            $message = 'Stock quantity and price updated successfully!';
            Log::info('Stock and price updated successfully for inventory ID: ' . $inventory_id . ', new quantity: ' . $newQuantity . ', new price: ' . $request->price);
        } else {
            $message = 'Price updated successfully!';
            Log::info('Price updated successfully for inventory ID: ' . $inventory_id . ', new price: ' . $request->price);
        }

        // Return proper Inertia redirect response
        return redirect()->route('admin.inventory')->with('success', $message);
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
}

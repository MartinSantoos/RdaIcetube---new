<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Inventory;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        // Get available sizes from inventory
        $availableSizes = \App\Models\Inventory::pluck('size')->unique()->toArray();
        
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'contact_number' => 'required|string|regex:/^[0-9]{11}$/|max:11',
            'quantity' => 'required|integer|min:1',
            'size' => 'required|string|in:' . implode(',', $availableSizes),
            'order_date' => 'required|date',
            'delivery_date' => 'required|date',
            'delivery_mode' => 'required|string|in:pick_up,deliver',
            'delivery_rider_id' => 'nullable|exists:users,id',
        ]);

        // Get price from inventory and check availability
        $inventory = Inventory::where('size', $request->size)
            ->where('status', 'available')
            ->first();
            
        if (!$inventory) {
            return redirect()->back()->withErrors(['size' => 'Selected size is not available in inventory.']);
        }

        if ($inventory->quantity < $request->quantity) {
            return redirect()->back()->withErrors(['quantity' => 'Insufficient stock for selected size.']);
        }

        $price = $inventory->price;
        $total = $price * $request->quantity;

        $order = Order::create([
            'customer_name' => $request->customer_name,
            'address' => $request->address,
            'contact_number' => $request->contact_number,
            'quantity' => $request->quantity,
            'size' => $request->size,
            'price' => $price,
            'total' => $total,
            'status' => 'pending',
            'order_date' => $request->order_date,
            'delivery_date' => $request->delivery_date,
            'delivery_mode' => $request->delivery_mode,
            'delivery_rider_id' => $request->delivery_mode === 'deliver' ? $request->delivery_rider_id : null,
        ]);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'order_created',
                "Created order #{$order->order_id} for {$request->customer_name} ({$request->quantity} {$request->size} units)",
                $order,
                [
                    'customer_name' => $request->customer_name,
                    'quantity' => $request->quantity,
                    'size' => $request->size,
                    'delivery_mode' => $request->delivery_mode
                ],
                auth()->user()->id
            );
        }

        // Subtract inventory quantity using helper method
        $this->deductInventoryForNewOrder($request->size, (int)$request->quantity);

        return redirect()->route('admin.point-of-sales')->with('success', 'Order created successfully!');
    }

    /**
     * Update the order status.
     */
    public function updateStatus(Request $request, $order_id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,out_for_delivery,completed,cancelled',
        ]);

        $order = Order::where('order_id', $order_id)->firstOrFail();
        $previousStatus = $order->status;
        
        // Handle inventory changes based on status transition
        try {
            if ($request->status === 'cancelled' && $previousStatus !== 'cancelled') {
                // Order is being cancelled - restore inventory
                $this->restoreInventoryForCancelledOrder($order);
            } elseif ($previousStatus === 'cancelled' && $request->status !== 'cancelled') {
                // Order is being reactivated from cancelled - deduct inventory again
                $this->deductInventoryForOrder($order);
            }
            
            $order->update([
                'status' => $request->status,
            ]);

            // Log the activity
            if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
                ActivityLog::log(
                    'order_status_updated',
                    "Updated order #{$order->order_id} status from '{$previousStatus}' to '{$request->status}'",
                    $order,
                    [
                        'previous_status' => $previousStatus,
                        'new_status' => $request->status,
                        'customer_name' => $order->customer_name
                    ],
                    auth()->user()->id
                );
            }

            return redirect()->back()->with('success', 'Order status updated successfully!');
            
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['status' => $e->getMessage()]);
        }
    }

    /**
     * Restore inventory quantity when an order is cancelled
     */
    private function restoreInventoryForCancelledOrder($order)
    {
        // Find the corresponding inventory item
        $inventory = \App\Models\Inventory::where('size', $order->size)->first();
        
        if ($inventory) {
            // Add back the quantity that was deducted
            $inventory->quantity += $order->quantity;
            
            // Update status based on new quantity
            if ($inventory->quantity > 10) {
                $inventory->status = 'available';
            } elseif ($inventory->quantity > 0 && $inventory->quantity <= 10) {
                $inventory->status = 'critical';
            } else {
                $inventory->status = 'out_of_stock';
            }
            
            $inventory->save();
            
            \Log::info("Restored inventory for cancelled order. Order ID: {$order->order_id}, Size: {$order->size}, Quantity restored: {$order->quantity}, New inventory quantity: {$inventory->quantity}");
        }
    }

    /**
     * Deduct inventory quantity for a new order
     */
    private function deductInventoryForNewOrder($size, $quantity)
    {
        $inventory = \App\Models\Inventory::where('size', $size)->first();
        
        if ($inventory && $inventory->quantity >= $quantity) {
            $inventory->quantity -= $quantity;
            
            // Update status based on new quantity
            if ($inventory->quantity == 0) {
                $inventory->status = 'out_of_stock';
            } elseif ($inventory->quantity <= 10) {
                $inventory->status = 'critical';
            } else {
                $inventory->status = 'available';
            }
            
            $inventory->save();
            
            \Log::info("Deducted inventory for new order. Size: {$size}, Quantity deducted: {$quantity}, New inventory quantity: {$inventory->quantity}");
        }
    }

    /**
     * Deduct inventory quantity when an order is reactivated from cancelled status
     */
    private function deductInventoryForOrder($order)
    {
        // Find the corresponding inventory item that is available
        $inventory = \App\Models\Inventory::where('size', $order->size)->first();
        
        if ($inventory) {
            // Check if there's enough stock
            if ($inventory->quantity >= $order->quantity) {
                // Deduct the quantity
                $inventory->quantity -= $order->quantity;
                
                // Update status based on new quantity
                if ($inventory->quantity == 0) {
                    $inventory->status = 'out_of_stock';
                } elseif ($inventory->quantity <= 10) {
                    $inventory->status = 'critical';
                } else {
                    $inventory->status = 'available';
                }
                
                $inventory->save();
                
                \Log::info("Deducted inventory for reactivated order. Order ID: {$order->order_id}, Size: {$order->size}, Quantity deducted: {$order->quantity}, New inventory quantity: {$inventory->quantity}");
            } else {
                \Log::warning("Insufficient inventory to reactivate order. Order ID: {$order->order_id}, Size: {$order->size}, Required: {$order->quantity}, Available: {$inventory->quantity}");
                throw new \Exception("Insufficient inventory to reactivate this order. Available stock: {$inventory->quantity}, Required: {$order->quantity}");
            }
        } else {
            \Log::error("Inventory item not found for reactivated order. Order ID: {$order->order_id}, Size: {$order->size}");
            throw new \Exception("Inventory item not found for size: {$order->size}");
        }
    }

    /**
     * Archive an order.
     */
    public function archive($order_id)
    {
        $order = Order::findOrFail($order_id);
        $order->archived = true;
        $order->save(); 

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'order_archived',
                "Archived order #{$order->order_id} for {$order->customer_name}",
                $order,
                ['customer_name' => $order->customer_name],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Order archived successfully!');
    }   
    /**
     * Restore an archived order.
     */
    public function restore($order_id)
    {
        $order = Order::findOrFail($order_id);
        $order->archived = false;
        $order->save();

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'order_restored',
                "Restored order #{$order->order_id} for {$order->customer_name}",
                $order,
                ['customer_name' => $order->customer_name],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Order restored successfully!');
    }

    /**
     * Permanently delete an order.
     */
    public function forceDelete($order_id)
    {
        $order = Order::findOrFail($order_id);
        
        // Store order info for logging before deletion
        $customerName = $order->customer_name;
        $orderId = $order->order_id;

        // Log the activity before deletion
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'order_permanently_deleted',
                "Permanently deleted order #{$orderId} for {$customerName}",
                null, // No object since it will be deleted
                ['customer_name' => $customerName, 'order_id' => $orderId],
                auth()->user()->id
            );
        }

        // Permanently delete the order
        $order->forceDelete();

        return redirect()->back()->with('success', 'Order permanently deleted successfully!');
    }

    /**
     * Show the receipt for an order.
     */
    public function showReceipt($order_id)
    {
        $order = Order::where('order_id', $order_id)->firstOrFail();
        
        return view('receipt', compact('order'));
    }

    /**
     * Display orders assigned to the authenticated employee.
     */
    public function employeeIndex()
    {
        $user = auth()->user();
        
        // Get orders assigned to this employee (delivery rider) - exclude archived orders
        $orders = Order::with('deliveryRider')
            ->where('delivery_rider_id', $user->id)
            ->where('archived', false) // Only show non-archived orders
            ->orderBy('created_at', 'desc')
            ->get();

        // Get inventory for order creation
        $inventory = Inventory::where('status', 'available')
            ->where('quantity', '>', 0)
            ->orderBy('size')
            ->get(['size', 'price', 'quantity', 'status']);

        return Inertia::render('employee/orders', [
            'user' => $user,
            'orders' => $orders,
            'inventory' => $inventory
        ]);
    }

    /**
     * Store a new order created by an employee.
     */
    public function employeeStore(Request $request)
    {
        $user = auth()->user();
        
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'contact_number' => 'required|string|regex:/^[0-9]{11}$/',
            'quantity' => 'required|integer|min:1',
            'size' => 'required|string',
            'order_date' => 'required|date',
            'delivery_date' => 'required|date|after_or_equal:today',
            'delivery_mode' => 'required|in:pick_up,deliver',
            'delivery_rider_id' => 'nullable|exists:users,id',
        ]);

        // Check inventory availability
        $inventory = Inventory::where('size', $request->size)
            ->where('status', 'available')
            ->first();

        if (!$inventory) {
            return back()->withErrors(['size' => 'Selected size is not available']);
        }

        if ($inventory->quantity < $request->quantity) {
            return back()->withErrors(['quantity' => 'Insufficient stock for selected size']);
        }

        // Set delivery rider based on delivery mode
        $deliveryRiderId = null;
        if ($request->delivery_mode === 'deliver') {
            $deliveryRiderId = $user->id; // Employee who creates the order becomes the delivery rider
        }

        // Calculate total
        $total = $inventory->price * $request->quantity;

        // Generate order ID
        $orderId = 'ORD-' . date('Ymd') . '-' . str_pad(Order::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);

        // Create the order
        $order = Order::create([
            'order_id' => $orderId,
            'customer_name' => $request->customer_name,
            'address' => $request->address,
            'contact_number' => $request->contact_number,
            'quantity' => $request->quantity,
            'size' => $request->size,
            'order_date' => $request->order_date,
            'delivery_date' => $request->delivery_date,
            'delivery_mode' => $request->delivery_mode,
            'delivery_rider_id' => $deliveryRiderId,
            'price' => $inventory->price,
            'total' => $total,
            'status' => 'pending',
        ]);

        // Update inventory
        $inventory->decrement('quantity', $request->quantity);

        // Log the activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'created',
            'description' => "Employee {$user->name} created order {$orderId} for {$request->customer_name}",
            'model_type' => 'Order',
            'model_id' => $order->id,
        ]);

        return redirect()->route('employee.orders')->with('success', 'Order created successfully!');
    }

    /**
     * Update order status for employee users.
     */
    public function employeeUpdateStatus(Request $request, $order_id)
    {
        $request->validate([
            'status' => 'required|string|in:out_for_delivery,completed',
            'delivery_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        $user = auth()->user();
        
        // Find the order and ensure it's assigned to this employee and not archived
        $order = Order::where('order_id', $order_id)
                     ->where('delivery_rider_id', $user->id)
                     ->where('archived', false) // Prevent updates to archived orders
                     ->firstOrFail();
        
        $previousStatus = $order->status;
        
        // Handle delivery photo upload for completed orders
        $deliveryPhotoPath = null;
        if ($request->status === 'completed' && $request->hasFile('delivery_photo')) {
            $photo = $request->file('delivery_photo');
            $filename = 'delivery_' . $order_id . '_' . time() . '.' . $photo->getClientOriginalExtension();
            $deliveryPhotoPath = $photo->storeAs('delivery_photos', $filename, 'public');
        }
        
        $updateData = [
            'status' => $request->status,
        ];
        
        if ($deliveryPhotoPath) {
            $updateData['delivery_photo'] = $deliveryPhotoPath;
        }
        
        $order->update($updateData);

        // Log the activity with more specific messages for delivery actions
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            $actionDescription = '';
            $actionType = '';
            
            if ($request->status === 'out_for_delivery') {
                $actionType = 'delivery_started';
                $actionDescription = "Started delivery for order #{$order->order_id} (Customer: {$order->customer_name})";
            } elseif ($request->status === 'completed') {
                $actionType = 'delivery_completed';
                $actionDescription = "Completed delivery for order #{$order->order_id} (Customer: {$order->customer_name})";
                if ($deliveryPhotoPath) {
                    $actionDescription .= " with delivery photo";
                }
            } else {
                $actionType = 'order_status_updated';
                $actionDescription = "Updated order #{$order->order_id} status from '{$previousStatus}' to '{$request->status}'";
            }
            
            ActivityLog::log(
                $actionType,
                $actionDescription,
                $order,
                [
                    'previous_status' => $previousStatus,
                    'new_status' => $request->status,
                    'customer_name' => $order->customer_name,
                    'delivery_rider' => $user->name,
                    'delivery_photo' => $deliveryPhotoPath
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Order status updated successfully!');
    }

    /**
     * Complete order with delivery photo (dedicated endpoint for photo completion)
     */
    public function completeOrderWithPhoto(Request $request, $order_id)
    {
        $request->validate([
            'delivery_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        $user = auth()->user();
        
        // Find the order and ensure it's assigned to this employee and not archived
        $order = Order::where('order_id', $order_id)
                     ->where('delivery_rider_id', $user->id)
                     ->where('archived', false) // Prevent updates to archived orders
                     ->where('status', 'out_for_delivery') // Only allow completion from out_for_delivery
                     ->firstOrFail();
        
        $previousStatus = $order->status;
        
        // Handle delivery photo upload
        $photo = $request->file('delivery_photo');
        $filename = 'delivery_' . $order_id . '_' . time() . '.' . $photo->getClientOriginalExtension();
        $deliveryPhotoPath = $photo->storeAs('delivery_photos', $filename, 'public');
        
        $order->update([
            'status' => 'completed',
            'delivery_photo' => $deliveryPhotoPath,
        ]);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'delivery_completed',
                "Completed delivery for order #{$order->order_id} (Customer: {$order->customer_name}) with delivery photo",
                $order,
                [
                    'previous_status' => $previousStatus,
                    'new_status' => 'completed',
                    'customer_name' => $order->customer_name,
                    'delivery_rider' => $user->name,
                    'delivery_photo' => $deliveryPhotoPath
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Order completed successfully with delivery photo!');
    }
}

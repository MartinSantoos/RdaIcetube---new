<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'contact_number' => 'required|string|regex:/^[0-9]{11}$/|max:11',
            'quantity' => 'required|integer|min:1',
            'size' => 'required|string|in:small,medium,large',
            'order_date' => 'required|date',
            'delivery_date' => 'required|date',
            'delivery_mode' => 'required|string|in:pick_up,deliver',
            'delivery_rider_id' => 'nullable|exists:users,id',
        ]);

        $order = Order::create([
            'customer_name' => $request->customer_name,
            'address' => $request->address,
            'contact_number' => $request->contact_number,
            'quantity' => $request->quantity,
            'size' => $request->size,
            'status' => 'pending',
            'order_date' => $request->order_date,
            'delivery_date' => $request->delivery_date,
            'delivery_mode' => $request->delivery_mode,
            'delivery_rider_id' => $request->delivery_mode === 'deliver' ? $request->delivery_rider_id : null,
        ]);

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

        return redirect()->back()->with('success', 'Order restored successfully!');
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
        
        // Get orders assigned to this employee (delivery rider)
        $orders = Order::with('deliveryRider')
            ->where('delivery_rider_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('employee/orders', [
            'user' => $user,
            'orders' => $orders
        ]);
    }

    /**
     * Update order status for employee users.
     */
    public function employeeUpdateStatus(Request $request, $order_id)
    {
        $request->validate([
            'status' => 'required|string|in:out_for_delivery,completed',
        ]);

        $user = auth()->user();
        
        // Find the order and ensure it's assigned to this employee
        $order = Order::where('order_id', $order_id)
                     ->where('delivery_rider_id', $user->id)
                     ->firstOrFail();
        
        $order->update([
            'status' => $request->status,
        ]);

        return redirect()->back()->with('success', 'Order status updated successfully!');
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Inventory;

class FixZeroTotals extends Command
{
    protected $signature = 'fix:zero-totals';
    protected $description = 'Fix orders with zero or null totals';

    public function handle()
    {
        $this->info('Fixing orders with zero or null totals...');

        // Find orders with zero or null totals
        $ordersToFix = Order::where(function($query) {
            $query->whereNull('total')
                  ->orWhere('total', 0)
                  ->orWhereNull('price')
                  ->orWhere('price', 0);
        })->get();

        $this->info("Found " . $ordersToFix->count() . " orders to fix.");

        $fixed = 0;
        foreach ($ordersToFix as $order) {
            $inventory = Inventory::where('size', $order->size)->first();
            
            if ($inventory) {
                $price = $inventory->price;
                $total = $price * $order->quantity;
                
                $order->update([
                    'price' => $price,
                    'total' => $total
                ]);
                
                $this->info("Fixed Order {$order->order_id}: price = {$price}, total = {$total}");
                $fixed++;
            } else {
                // Set default price based on size if inventory not found
                $defaultPrices = [
                    'small' => 50,
                    'medium' => 100,
                    'large' => 150,
                    'extra small' => 40,
                    'extra large' => 200
                ];
                
                $size = strtolower($order->size);
                $price = $defaultPrices[$size] ?? 100;
                $total = $price * $order->quantity;
                
                $order->update([
                    'price' => $price,
                    'total' => $total
                ]);
                
                $this->warn("Fixed Order {$order->order_id} with default price: price = {$price}, total = {$total}");
                $fixed++;
            }
        }

        $this->info("Fixed {$fixed} orders!");
    }
}
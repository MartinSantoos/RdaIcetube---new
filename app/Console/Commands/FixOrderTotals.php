<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Inventory;

class FixOrderTotals extends Command
{
    protected $signature = 'fix:order-totals';
    protected $description = 'Fix orders with null total values';

    public function handle()
    {
        $this->info('Fixing orders with null total values...');

        $ordersWithoutTotal = Order::whereNull('total')->get();

        $this->info("Found " . $ordersWithoutTotal->count() . " orders without total values.");

        foreach ($ordersWithoutTotal as $order) {
            $inventory = Inventory::where('size', $order->size)->first();
            
            if ($inventory) {
                $price = $inventory->price;
                $total = $price * $order->quantity;
                
                $order->update([
                    'price' => $price,
                    'total' => $total
                ]);
                
                $this->info("Updated Order {$order->order_id}: price = {$price}, total = {$total}");
            } else {
                // Set default price based on size if inventory not found
                $defaultPrices = [
                    'small' => 50,
                    'medium' => 100,
                    'large' => 150
                ];
                
                $price = $defaultPrices[$order->size] ?? 100;
                $total = $price * $order->quantity;
                
                $order->update([
                    'price' => $price,
                    'total' => $total
                ]);
                
                $this->info("Updated Order {$order->order_id} with default price: price = {$price}, total = {$total}");
            }
        }

        $this->info('Fix completed!');
    }
}
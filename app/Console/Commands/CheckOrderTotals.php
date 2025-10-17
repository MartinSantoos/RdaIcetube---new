<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;

class CheckOrderTotals extends Command
{
    protected $signature = 'check:order-totals';
    protected $description = 'Check current order totals in database';

    public function handle()
    {
        $this->info('Checking order totals in database...');

        $orders = Order::orderBy('order_id', 'desc')->take(10)->get(['order_id', 'customer_name', 'size', 'quantity', 'price', 'total']);
        
        $this->info('Recent orders:');
        foreach ($orders as $order) {
            $this->info("Order {$order->order_id}: {$order->customer_name} - {$order->size} x{$order->quantity} = Price: ₱{$order->price} | Total: ₱{$order->total}");
        }
        
        $zeroTotalCount = Order::where('total', 0)->orWhereNull('total')->count();
        $this->info("\nOrders with zero/null total: {$zeroTotalCount}");
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public $timestamps = true; // Enable Laravel timestamps
    
    protected $fillable = [
        'customer_name',
        'address', 
        'contact_number',
        'quantity',
        'size',
        'total',
        'status',
        'order_date',
        'delivery_date',
        'delivery_mode',
        'delivery_rider_id',
    ];

    protected $casts = [
        'order_date' => 'date',
        'delivery_date' => 'date',
        'total' => 'decimal:2',
    ];

    protected $appends = ['price', 'total'];

    protected $primaryKey = 'order_id';

    /**
     * Get the price for this order from inventory based on size
     */
    public function getPriceAttribute()
    {
        // Try to find inventory with exact size match (regardless of status)
        $inventory = Inventory::where('size', trim($this->size))->first();
        
        $price = 0.00;
        if ($inventory && isset($inventory->price) && $inventory->price !== null && $inventory->price !== '') {
            $price = (float) $inventory->price;
        } else {
            // Debug: Log when no inventory is found
            \Log::warning('No inventory found for order', [
                'order_id' => $this->order_id ?? 'new',
                'order_size' => $this->size,
                'available_sizes' => Inventory::pluck('size')->toArray()
            ]);
        }
        
        return $price;
    }

    /**
     * Get the total attribute (always return the fixed database value)
     */
    public function getTotalAttribute($value)
    {
        // Always return the database value - totals should never change once set
        if ($value !== null) {
            return (float) $value;
        }
        
        // This should rarely happen since boot() method sets total on creation
        // But just in case, calculate it once
        $price = $this->getPriceAttribute();
        $quantity = $this->quantity ?? 0;
        return (float) ($price * $quantity);
    }

    /**
     * Calculate and set the total when order is saved (only for new orders)
     */
    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($order) {
            // Only calculate total if it's not already set (new order creation)
            if (is_null($order->total)) {
                $price = $order->getPriceAttribute();
                $order->total = $price * ($order->quantity ?? 0);
            }
            // Never recalculate total for existing orders - it should remain fixed
        });
    }
    
    /**
     * Get the delivery rider for this order
     */
    public function deliveryRider()
    {
        return $this->belongsTo(User::class, 'delivery_rider_id');
    }

    /**
     * Relationship to inventory based on size
     */
    public function inventory()
    {
        return $this->hasOne(Inventory::class, 'size', 'size');
    }
}

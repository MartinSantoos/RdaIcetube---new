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
        'price',
        'total',
        'status',
        'order_date',
        'delivery_date',
        'delivery_mode',
        'delivery_rider_id',
        'delivery_photo',
    ];

    protected $casts = [
        'order_date' => 'date',
        'delivery_date' => 'date',
        'price' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected $primaryKey = 'order_id';
    
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

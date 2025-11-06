<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';
    
    protected $primaryKey = 'inventory_id';
    
    public $incrementing = true;
    
    protected $keyType = 'int';

    protected $fillable = [
        'product_name',
        'size',
        'price',
        'quantity',
        'status',
        'date_created',
        'archived_at'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'date_created' => 'date',
        'archived_at' => 'datetime'
    ];

    public $timestamps = false;

    /**
     * Get formatted inventory number
     */
    public function getFormattedInventoryIdAttribute()
    {
        return 'INV-' . str_pad($this->inventory_id, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate a unique inventory number
     */
    public static function generateInventoryNumber()
    {
        $count = self::count() + 1;
        return 'INV-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}

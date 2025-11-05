<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class JobOrder extends Model
{
    use HasFactory;

    protected $table = 'job_orders';
    
    protected $primaryKey = 'job_order_id';
    
    public $incrementing = true;
    
    protected $keyType = 'int';

    protected $fillable = [
        'job_order_number',
        'product_name',
        'size',
        'quantity_to_produce',
        'status',
        'production_date',
        'started_at',
        'completed_at',
        'created_by',
        'assigned_to',
        'notes',
        'cancellation_reason',
        'cancelled_at'
    ];

    protected $casts = [
        'quantity_to_produce' => 'integer',
        'production_date' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the user who created this job order
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user assigned to this job order
     */
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the inventory item this job order relates to
     */
    public function inventory()
    {
        return $this->hasOne(Inventory::class, 'size', 'size')
                    ->where('product_name', '=', $this->product_name);
    }

    /**
     * Generate a unique job order number
     */
    public static function generateJobOrderNumber()
    {
        $date = now()->format('Ymd');
        $count = self::whereDate('created_at', today())->count() + 1;
        return 'JO-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}

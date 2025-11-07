<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Maintenance extends Model
{
    protected $fillable = [
        'equipment_id',
        'maintenance_type',
        'status',
        'description',
        'maintenance_date',
        'cost',
        'equipment_status_at_maintenance',
        'equipment_broken_reason_at_maintenance',
        'operational_reason',
        'broken_reason',
    ];

    protected $casts = [
        'maintenance_date' => 'date',
        'cost' => 'decimal:2',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }
}

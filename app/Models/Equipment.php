<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $table = 'equipment';
    
    protected $fillable = [
        'equipment_name',
        'equipment_type',
        'status',
        'broken_reason',
        'recurring_maintenance',
        'maintenance_type',
        'maintenance_frequency_minutes',
        'maintenance_end_date',
    ];

    public function maintenances()
    {
        return $this->hasMany(Maintenance::class);
    }

    /**
     * Get formatted equipment number
     */
    public function getFormattedEquipmentIdAttribute()
    {
        return 'EQ-' . str_pad($this->id, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate a unique equipment number
     */
    public static function generateEquipmentNumber()
    {
        $count = self::count() + 1;
        return 'EQ-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
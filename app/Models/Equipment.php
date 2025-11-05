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
    ];

    public function maintenances()
    {
        return $this->hasMany(Maintenance::class);
    }
}
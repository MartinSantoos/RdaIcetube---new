<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Populate existing maintenance records with equipment status snapshot
        // For existing records, we'll use the maintenance status to infer equipment status
        
        // For maintenance records with status 'broken', set equipment status as 'broken'
        DB::statement("
            UPDATE maintenances 
            SET equipment_status_at_maintenance = 'broken'
            WHERE status = 'broken' 
            AND equipment_status_at_maintenance IS NULL
        ");
        
        // For maintenance records with status 'completed', set equipment status as 'operational'
        DB::statement("
            UPDATE maintenances 
            SET equipment_status_at_maintenance = 'operational'
            WHERE status = 'completed' 
            AND equipment_status_at_maintenance IS NULL
        ");
        
        // For maintenance records with status 'scheduled' or 'in_progress', try to get current equipment status
        DB::statement("
            UPDATE maintenances m
            JOIN equipment e ON m.equipment_id = e.id
            SET m.equipment_status_at_maintenance = e.status,
                m.equipment_broken_reason_at_maintenance = e.broken_reason
            WHERE m.status IN ('scheduled', 'in_progress')
            AND m.equipment_status_at_maintenance IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear the populated data
        DB::table('maintenances')->update([
            'equipment_status_at_maintenance' => null,
            'equipment_broken_reason_at_maintenance' => null
        ]);
    }
};

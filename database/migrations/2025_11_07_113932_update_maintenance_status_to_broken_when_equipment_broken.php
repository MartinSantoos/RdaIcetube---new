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
        // Update maintenance records to 'broken' status when their equipment is broken
        DB::statement("
            UPDATE maintenances 
            SET status = 'broken' 
            WHERE equipment_id IN (
                SELECT id FROM equipment WHERE status = 'broken'
            ) 
            AND status IN ('scheduled', 'in_progress', 'completed')
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For rollback, we can't easily determine the original status
        // So we'll set them to 'scheduled' as a safe default
        DB::statement("
            UPDATE maintenances 
            SET status = 'scheduled' 
            WHERE equipment_id IN (
                SELECT id FROM equipment WHERE status = 'broken'
            ) 
            AND status = 'broken'
        ");
    }
};

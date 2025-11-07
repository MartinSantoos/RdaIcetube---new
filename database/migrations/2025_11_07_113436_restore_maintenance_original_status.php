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
        // Since we can't determine the original status of maintenance records 
        // that were changed to 'broken', we'll update them to logical defaults:
        // - For emergency maintenance that was marked broken, assume it was 'completed'
        // - For routine maintenance that was marked broken, assume it was 'scheduled'
        
        // Update emergency maintenance records from 'broken' to 'completed'
        DB::table('maintenances')
            ->where('status', 'broken')
            ->where('maintenance_type', 'Emergency')
            ->update(['status' => 'completed']);
            
        // Update routine maintenance records from 'broken' to 'scheduled'  
        DB::table('maintenances')
            ->where('status', 'broken')
            ->where('maintenance_type', 'Routine')
            ->update(['status' => 'scheduled']);
            
        // Update any other maintenance types from 'broken' to 'scheduled'
        DB::table('maintenances')
            ->where('status', 'broken')
            ->whereNotIn('maintenance_type', ['Emergency', 'Routine'])
            ->update(['status' => 'scheduled']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert maintenance records back to 'broken' status
        // This is for rollback purposes only
        
        DB::table('maintenances')
            ->whereIn('status', ['completed', 'scheduled'])
            ->where(function($query) {
                $query->where('maintenance_type', 'Emergency')
                      ->orWhere('maintenance_type', 'Routine')
                      ->orWhereNotIn('maintenance_type', ['Emergency', 'Routine']);
            })
            ->update(['status' => 'broken']);
    }
};

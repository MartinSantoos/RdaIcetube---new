<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Equipment;
use App\Models\Maintenance;
use App\Models\ActivityLog;
use Carbon\Carbon;

class ProcessRecurringMaintenance extends Command
{
    protected $signature = 'maintenance:process-recurring';
    protected $description = 'Process recurring maintenance schedules and create maintenance records';

    public function handle()
    {
        $this->info('Processing recurring maintenance schedules...');
        
        // Get all equipment that should be under maintenance based on recurring schedule
        $equipment = Equipment::where('recurring_maintenance', true)
            ->where('status', '!=', 'broken')
            ->get();
            
        foreach ($equipment as $item) {
            $this->processEquipmentMaintenance($item);
        }
        
        $this->info('Recurring maintenance processing completed.');
        return 0;
    }
    
    private function processEquipmentMaintenance($equipment)
    {
        $now = Carbon::now();
        
        // Check if equipment needs maintenance based on frequency
        $lastMaintenance = Maintenance::where('equipment_id', $equipment->id)
            ->whereIn('status', ['completed', 'scheduled'])
            ->orderBy('maintenance_date', 'desc')
            ->first();
            
        $shouldSchedule = false;
        $nextMaintenanceDate = null;
        
        if (!$lastMaintenance) {
            // No previous maintenance, schedule immediately
            $shouldSchedule = true;
            $nextMaintenanceDate = $now;
        } else {
            // Calculate next maintenance date based on frequency
            $lastMaintenanceDate = Carbon::parse($lastMaintenance->maintenance_date);
            $frequencyMinutes = $equipment->maintenance_frequency_minutes ?? 5; // Default 5 minutes for testing
            
            $nextMaintenanceDate = $lastMaintenanceDate->addMinutes($frequencyMinutes);
            
            if ($now->gte($nextMaintenanceDate)) {
                $shouldSchedule = true;
            }
        }
        
        if ($shouldSchedule) {
            // Check if there's already a pending maintenance for today
            $existingMaintenance = Maintenance::where('equipment_id', $equipment->id)
                ->whereIn('status', ['scheduled', 'in_progress'])
                ->whereDate('maintenance_date', $now->toDateString())
                ->first();
                
            if (!$existingMaintenance) {
                $this->createRecurringMaintenance($equipment, $nextMaintenanceDate);
            }
        }
    }
    
    private function createRecurringMaintenance($equipment, $maintenanceDate)
    {
        $maintenance = Maintenance::create([
            'equipment_id' => $equipment->id,
            'maintenance_type' => $equipment->maintenance_type ?? 'Preventive',
            'status' => 'scheduled',
            'description' => 'Scheduled recurring maintenance',
            'maintenance_date' => $maintenanceDate,
            'cost' => 0,
            'equipment_status_at_maintenance' => $equipment->status,
            'equipment_broken_reason_at_maintenance' => $equipment->broken_reason,
        ]);

        // Update equipment status to under_maintenance
        $equipment->update(['status' => 'under_maintenance']);

        // Log the activity
        ActivityLog::log(
            'recurring_maintenance_scheduled',
            "Automatically scheduled recurring maintenance for {$equipment->equipment_name}",
            $equipment,
            [
                'equipment_name' => $equipment->equipment_name,
                'maintenance_type' => $maintenance->maintenance_type,
                'maintenance_date' => $maintenanceDate->format('Y-m-d H:i:s'),
                'scheduled_by' => 'System (Recurring)'
            ],
            null // System action, no specific user
        );
        
        $this->info("Scheduled recurring maintenance for: {$equipment->equipment_name}");
    }
}
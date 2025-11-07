<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use App\Models\Maintenance;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class EquipmentController extends Controller
{
    /**
     * Display the equipment page
     */
    public function index()
    {
        $equipment = Equipment::with(['maintenances' => function($query) {
            $query->orderBy('created_at', 'desc');
        }])->get();
        
        return Inertia::render('admin/equipment', [
            'user' => auth()->user(),
            'equipment' => $equipment
        ]);
    }

    /**
     * Store a new equipment
     */
    public function store(Request $request)
    {
        $request->validate([
            'equipment_name' => 'required|string|max:255',
            'equipment_type' => 'required|string|max:255',
        ]);

        $equipment = Equipment::create([
            'equipment_name' => $request->equipment_name,
            'equipment_type' => $request->equipment_type,
            'status' => 'operational', // Default status
        ]);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'equipment_created',
                "Added new equipment: {$request->equipment_name} (Type: {$request->equipment_type})",
                $equipment,
                [
                    'equipment_name' => $request->equipment_name,
                    'equipment_type' => $request->equipment_type,
                    'status' => 'operational'
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Equipment added successfully!');
    }

    /**
     * Schedule maintenance for equipment
     */
    public function scheduleMaintenance(Request $request)
    {
        $request->validate([
            'equipment_id' => 'required|exists:equipment,id',
            'maintenance_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'maintenance_date' => 'required|date',
            'cost' => 'nullable|numeric|min:0',
        ]);

        $equipment = Equipment::findOrFail($request->equipment_id);

        // Create the maintenance record with equipment status snapshot
        $maintenance = Maintenance::create([
            'equipment_id' => $request->equipment_id,
            'maintenance_type' => $request->maintenance_type,
            'status' => 'scheduled',
            'description' => $request->description,
            'maintenance_date' => $request->maintenance_date,
            'cost' => $request->cost,
            'equipment_status_at_maintenance' => $equipment->status,
            'equipment_broken_reason_at_maintenance' => $equipment->broken_reason,
        ]);

        $equipment->update(['status' => 'under_maintenance']);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'maintenance_scheduled',
                "Scheduled {$request->maintenance_type} maintenance for {$equipment->equipment_name} on " . date('M j, Y', strtotime($request->maintenance_date)),
                $equipment,
                [
                    'equipment_name' => $equipment->equipment_name,
                    'maintenance_type' => $request->maintenance_type,
                    'maintenance_date' => $request->maintenance_date,
                    'cost' => $request->cost,
                    'description' => $request->description
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Maintenance scheduled successfully!');
    }

    /**
     * Complete maintenance record
     */
    public function completeMaintenance($id)
    {
        $maintenance = Maintenance::findOrFail($id);
        $equipment = $maintenance->equipment;
        
        // Update maintenance status to completed
        $maintenance->update(['status' => 'completed']);
        
        // Check if there are any other active maintenances for this equipment
        // Note: 'broken' maintenance records are not considered active and remain as historical records
        $pendingMaintenance = Maintenance::where('equipment_id', $equipment->id)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->exists();
        
        // If no pending maintenance, mark equipment as operational
        if (!$pendingMaintenance) {
            $equipment->update(['status' => 'operational']);
        }

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'maintenance_completed',
                "Completed {$maintenance->maintenance_type} maintenance for {$equipment->equipment_name}",
                $equipment,
                [
                    'maintenance_id' => $maintenance->id,
                    'maintenance_type' => $maintenance->maintenance_type,
                    'equipment_name' => $equipment->equipment_name,
                    'equipment_type' => $equipment->equipment_type,
                    'completion_date' => now()->format('Y-m-d H:i:s')
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Maintenance completed successfully!');
    }

    /**
     * Mark equipment as operational (maintenance completed)
     */
    public function markAsOperational(Request $request, $id)
    {
        $equipment = Equipment::findOrFail($id);
        
        // Get the reason from request
        $reason = $request->input('reason');
        
        // Update equipment status (but keep broken_reason as historical record)
        $equipment->update(['status' => 'operational']);
        
        // Only update scheduled and in_progress maintenance to completed
        // NEVER update broken maintenance records - they must remain as historical records
        Maintenance::where('equipment_id', $id)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->update([
                'status' => 'completed',
                'operational_reason' => $reason
            ]);

        // Log the activity with reason
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            $activityMessage = "Completed maintenance for {$equipment->equipment_name} - Equipment back to operational status";
            if ($reason) {
                $activityMessage .= ". Reason: {$reason}";
            }
            
            ActivityLog::log(
                'maintenance_completed',
                $activityMessage,
                $equipment,
                [
                    'equipment_name' => $equipment->equipment_name,
                    'equipment_type' => $equipment->equipment_type,
                    'previous_status' => 'under_maintenance',
                    'new_status' => 'operational',
                    'operational_reason' => $reason
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Equipment marked as operational successfully!');
    }

    /**
     * Mark equipment as broken
     */
    public function markAsBroken(Request $request, $id)
    {
        $equipment = Equipment::findOrFail($id);
        $previousStatus = $equipment->status;
        
        // Validate that a reason is provided
        $request->validate([
            'reason' => 'required|string|max:1000'
        ]);
        
        // Update equipment status and broken reason
        $equipment->update([
            'status' => 'broken',
            'broken_reason' => $request->reason
        ]);
        
        // Mark any ongoing maintenance as broken and capture equipment status snapshot
        Maintenance::where('equipment_id', $id)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->update([
                'status' => 'broken',
                'equipment_status_at_maintenance' => 'broken',
                'equipment_broken_reason_at_maintenance' => $request->reason,
                'broken_reason' => $request->reason
            ]);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'equipment_broken',
                "Marked {$equipment->equipment_name} as broken",
                $equipment,
                [
                    'equipment_name' => $equipment->equipment_name,
                    'equipment_type' => $equipment->equipment_type,
                    'previous_status' => $previousStatus,
                    'new_status' => 'broken',
                    'broken_reason' => $request->reason
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Equipment marked as broken successfully!');
    }

    /**
     * Get equipment statistics for dashboard
     */
    public function getDashboardStats()
    {
        $stats = [
            'total' => Equipment::count(),
            'operational' => Equipment::where('status', 'operational')->count(),
            'under_maintenance' => Equipment::where('status', 'under_maintenance')->count(),
            'broken' => Equipment::where('status', 'broken')->count(),
        ];

        $equipment = Equipment::with(['maintenances' => function($query) {
            $query->orderBy('created_at', 'desc')->limit(3);
        }])->get();

        return response()->json([
            'stats' => $stats,
            'equipment' => $equipment
        ]);
    }

    /**
     * Export equipment report
     */
    public function export(Request $request)
    {
        $equipmentQuery = Equipment::with(['maintenances' => function($query) use ($request) {
            $query->orderBy('maintenance_date', 'desc');
            
            // Filter maintenances by maintenance date range if provided
            if ($request->has('start_date') && $request->has('end_date')) {
                $startDate = $request->input('start_date');
                $endDate = $request->input('end_date');
                
                // Validate date formats and apply filtering
                if ($startDate && $endDate) {
                    $query->whereDate('maintenance_date', '>=', $startDate)
                          ->whereDate('maintenance_date', '<=', $endDate);
                }
            }
        }]);

        // If date filtering is applied, only include equipment that has maintenance records in the date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            // Validate dates and apply filtering
            if ($startDate && $endDate) {
                $equipmentQuery->whereHas('maintenances', function($query) use ($startDate, $endDate) {
                    $query->whereDate('maintenance_date', '>=', $startDate)
                          ->whereDate('maintenance_date', '<=', $endDate);
                });
            }
        }

        $equipment = $equipmentQuery->orderBy('created_at', 'desc')->get();

        // Generate PDF report directly
        return $this->generateEquipmentPdf($equipment, $request);
    }



    private function generateEquipmentPdf($equipment, $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        
        $totalEquipment = $equipment->count();
        $operationalCount = $equipment->where('status', 'operational')->count();
        $maintenanceCount = $equipment->where('status', 'under_maintenance')->count();
        $brokenCount = $equipment->where('status', 'broken')->count();
        
        $pdf = Pdf::loadView('exports.equipment-pdf', [
            'equipment' => $equipment,
            'totalEquipment' => $totalEquipment,
            'operationalEquipment' => $operationalCount,
            'maintenanceEquipment' => $maintenanceCount,
            'brokenEquipment' => $brokenCount,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'generatedAt' => now()->format('F j, Y \a\t g:i A'),
        ]);

        $filename = 'maintenance-report-' . date('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }
}

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

        // Create the maintenance record 
        $maintenance = Maintenance::create([
            'equipment_id' => $request->equipment_id,
            'maintenance_type' => $request->maintenance_type,
            'status' => 'scheduled',
            'description' => $request->description,
            'maintenance_date' => $request->maintenance_date,
            'cost' => $request->cost,
        ]);

        $equipment = Equipment::findOrFail($request->equipment_id);
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
        
        // Check if there are any other scheduled maintenances for this equipment
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
    public function markAsOperational($id)
    {
        $equipment = Equipment::findOrFail($id);
        
        // Update equipment status
        $equipment->update(['status' => 'operational']);
        
       
        Maintenance::where('equipment_id', $id)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->update(['status' => 'completed']);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'maintenance_completed',
                "Completed maintenance for {$equipment->equipment_name} - Equipment back to operational status",
                $equipment,
                [
                    'equipment_name' => $equipment->equipment_name,
                    'equipment_type' => $equipment->equipment_type,
                    'previous_status' => 'under_maintenance',
                    'new_status' => 'operational'
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Equipment marked as operational successfully!');
    }

    /**
     * Mark equipment as broken
     */
    public function markAsBroken($id)
    {
        $equipment = Equipment::findOrFail($id);
        $previousStatus = $equipment->status;
        
        // Update equipment status
        $equipment->update(['status' => 'broken']);
        
        // Cancel any ongoing maintenance
        Maintenance::where('equipment_id', $id)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->update(['status' => 'cancelled']);

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
                    'new_status' => 'broken'
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
        $equipmentQuery = Equipment::with(['maintenances' => function($query) {
            $query->orderBy('created_at', 'desc');
        }]);

        // Filter equipment by date range if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            // Ensure proper date format for filtering
            $equipmentQuery->whereDate('created_at', '>=', $startDate)
                          ->whereDate('created_at', '<=', $endDate);
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

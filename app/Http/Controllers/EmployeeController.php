<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;

class EmployeeController extends Controller
{
    /**
     * Display the employee list
     */
    public function index()
    {
        $employees = User::activeEmployees()->get();
        $archivedEmployees = User::archivedEmployees()->get();
        
        return inertia('admin/employees', [
            'employees' => $employees,
            'archivedEmployees' => $archivedEmployees,
            'user' => auth()->user()
        ]);
    }

    /**
     * Store a newly created employee
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'contact' => 'required|string|regex:/^09\d{9}$/|max:15',
            'password' => 'required|string|min:3',
            'status' => 'required|in:active,inactive',
        ]);

        // Generate username from name (just the name without spaces, lowercase)
        $username = strtolower(str_replace(' ', '', $request->name));
        
        // Check if username already exists and add a number if needed
        $originalUsername = $username;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $originalUsername . $counter;
            $counter++;
        }
        
        // Use password from form (default is "123")
        $password = $request->password;

        // Determine user type based on position
        $userType = strtolower($request->position) === 'admin' ? 1 : 2;

        $employee = User::create([
            'name' => $request->name,
            'username' => $username,
            'email' => null, // Email is nullable for employees
            'password' => Hash::make($password),
            'user_type' => $userType, // Admin (1) if position is Admin, otherwise Employee (2)
            'contact_number' => $request->contact,
            'position' => $request->position,
            'status' => $request->status,
        ]);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'employee_created',
                "Added new employee: {$request->name} (Position: {$request->position}, Username: {$username})",
                $employee,
                [
                    'name' => $request->name,
                    'username' => $username,
                    'position' => $request->position,
                    'contact' => $request->contact,
                    'status' => $request->status,
                    'user_type' => $userType
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Employee added successfully! Username: ' . $username . ', Password: ' . $password);
    }

    /**
     * Update the specified employee
     */
    public function update(Request $request, $id)
    {
        $employee = User::whereIn('user_type', [1, 2])->findOrFail($id);

        // Store original values for comparison
        $originalData = $employee->only(['name', 'contact_number', 'position', 'status', 'user_type']);

        $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'contact' => 'required|string|regex:/^09\d{9}$/|max:15',
            'status' => 'required|in:active,inactive',
        ]);

        // Determine user type based on position
        $userType = strtolower($request->position) === 'admin' ? 1 : 2;

        $updateData = [
            'name' => $request->name,
            'contact_number' => $request->contact,
            'position' => $request->position,
            'status' => $request->status,
            'user_type' => $userType, // Update user type based on position
        ];

        // Note: Password is not updated for security reasons
        // Only name, contact, position, status, and user_type can be changed

        $employee->update($updateData);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            $changes = [];
            if ($originalData['name'] !== $request->name) $changes[] = "Name: {$originalData['name']} → {$request->name}";
            if ($originalData['position'] !== $request->position) $changes[] = "Position: {$originalData['position']} → {$request->position}";
            if ($originalData['contact_number'] !== $request->contact) $changes[] = "Contact: {$originalData['contact_number']} → {$request->contact}";
            if ($originalData['status'] !== $request->status) $changes[] = "Status: {$originalData['status']} → {$request->status}";
            
            if (!empty($changes)) {
                $changeText = implode(', ', $changes);
                ActivityLog::log(
                    'employee_updated',
                    "Updated employee {$employee->name} ({$employee->username}): {$changeText}",
                    $employee,
                    [
                        'original_data' => $originalData,
                        'new_data' => $updateData,
                        'changes' => $changes
                    ],
                    auth()->user()->id
                );
            }
        }

        return redirect()->back()->with('success', 'Employee updated successfully!');
    }

    /**
     * Remove the specified employee (soft delete - archive)
     */
    public function destroy($id)
    {
        $employee = User::activeEmployees()->findOrFail($id);
        $employee->delete(); // This will now use soft delete (archived_at)

        return redirect()->back()->with('success', 'Employee archived successfully!');
    }

    /**
     * Archive the specified employee (soft delete)
     */
    public function archive($id)
    {
        $employee = User::activeEmployees()->findOrFail($id);
        $employee->delete(); // This will now use soft delete (archived_at)

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'employee_archived',
                "Archived employee: {$employee->name} ({$employee->username}) - Position: {$employee->position}",
                $employee,
                [
                    'name' => $employee->name,
                    'username' => $employee->username,
                    'position' => $employee->position,
                    'contact' => $employee->contact_number
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Employee archived successfully!');
    }

    /**
    /**
     * Display archived employees
     */
    public function archived()
    {
        $archivedEmployees = User::archivedEmployees()->get();
        return inertia('admin/archived-employees', [
            'archivedEmployees' => $archivedEmployees,
            'user' => auth()->user()
        ]);
    }

    /**
     * Restore an archived employee
     */
    public function restore($id)
    {
        $employee = User::archivedEmployees()->findOrFail($id);
        $employee->restore();

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'employee_restored',
                "Restored employee: {$employee->name} ({$employee->username}) - Position: {$employee->position}",
                $employee,
                [
                    'name' => $employee->name,
                    'username' => $employee->username,
                    'position' => $employee->position,
                    'contact' => $employee->contact_number
                ],
                auth()->user()->id
            );
        }

        return redirect()->back()->with('success', 'Employee restored successfully!');
    }

    /**
     * Permanently delete an employee
     */
    public function forceDelete($id)
    {
        $employee = User::archivedEmployees()->findOrFail($id);
        $employee->forceDelete();

        return redirect()->back()->with('success', 'Employee permanently deleted!');
    }

    /**
     * Toggle employee status
     */
    public function toggleStatus($id)
    {
        $employee = User::activeEmployees()->findOrFail($id);
        $oldStatus = $employee->status;
        $newStatus = $employee->status === 'active' ? 'inactive' : 'active';
        
        $employee->update(['status' => $newStatus]);

        // Log the activity
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            $action = $newStatus === 'active' ? 'enabled' : 'disabled';
            ActivityLog::log(
                'employee_status_toggled',
                "Changed employee status for {$employee->name} ({$employee->username}): {$oldStatus} → {$newStatus}",
                $employee,
                [
                    'name' => $employee->name,
                    'username' => $employee->username,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'action' => $action
                ],
                auth()->user()->id
            );
        }

        $action = $newStatus === 'active' ? 'enabled' : 'disabled';
        return redirect()->back()->with('success', 'Employee ' . $action . ' successfully!');
    }

    /**
     * Export employee data as CSV or PDF
     */
    public function export(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        // Get employee data within date range (using created_at)
        $query = User::activeEmployees()->orderBy('created_at', 'desc');
        
        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }
        
        $employees = $query->get();

        // Generate PDF report directly
        return $this->generateEmployeePdf($employees, $startDate, $endDate);
    }



    private function generateEmployeePdf($employees, $startDate, $endDate)
    {
        $filename = 'employees_report_' . date('Y-m-d_H-i-s') . '.pdf';
        
        $totalEmployees = $employees->count();
        $activeEmployees = $employees->where('status', 'active')->count();
        $inactiveEmployees = $employees->where('status', 'inactive')->count();
        
        $pdf = Pdf::loadView('exports.employees-pdf', [
            'employees' => $employees,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalEmployees' => $totalEmployees,
            'activeEmployees' => $activeEmployees,
            'inactiveEmployees' => $inactiveEmployees,
            'generatedAt' => now()->format('F j, Y \a\t g:i A')
        ]);

        return $pdf->download($filename);
    }
}

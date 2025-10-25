<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Barryvdh\DomPDF\Facade\Pdf;

class EmployeeController extends Controller
{
    /**
     * Display the employee list
     */
    public function index()
    {
        $currentUser = auth()->user();
        
        // Get base queries for employees
        $employeesQuery = User::activeEmployees();
        $archivedEmployeesQuery = User::archivedEmployees();
        
        // If current user is not a System Administrator, exclude their own account
        if (!$currentUser->isSystemAdministrator()) {
            $employeesQuery = $employeesQuery->where('id', '!=', $currentUser->id);
            $archivedEmployeesQuery = $archivedEmployeesQuery->where('id', '!=', $currentUser->id);
        }
        
        $employees = $employeesQuery->get();
        $archivedEmployees = $archivedEmployeesQuery->get();
        
        return inertia('admin/employees', [
            'employees' => $employees,
            'archivedEmployees' => $archivedEmployees,
            'user' => $currentUser
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
            'password' => ['required', Password::defaults()],
            'status' => 'required|in:active,inactive',
        ]);

        // Check if an employee with the same name already exists
        $existingEmployee = User::whereIn('user_type', [1, 2])
            ->where('name', $request->name)
            ->whereNull('archived_at')
            ->first();

        if ($existingEmployee) {
            return redirect()->back()->withErrors([
                'name' => 'An employee with this name already exists. Please use a different name or modify the existing employee.'
            ])->withInput();
        }

        // Check if contact number already exists
        $existingContact = User::whereIn('user_type', [1, 2])
            ->where('contact_number', $request->contact)
            ->whereNull('archived_at')
            ->first();

        if ($existingContact) {
            return redirect()->back()->withErrors([
                'contact' => 'This contact number is already registered to another employee.'
            ])->withInput();
        }

        try {
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
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database-specific errors
            if ($e->getCode() == 23000) { // Integrity constraint violation
                $errorMessage = 'Database error: ';
                
                if (str_contains($e->getMessage(), 'username')) {
                    $errorMessage .= 'Username already exists. Please try again.';
                } elseif (str_contains($e->getMessage(), 'contact_number')) {
                    $errorMessage .= 'Contact number already exists.';
                } else {
                    $errorMessage .= 'Duplicate data detected. Please check your input.';
                }
                
                return redirect()->back()->withErrors([
                    'general' => $errorMessage
                ])->withInput();
            }
            
            // Handle other database errors
            return redirect()->back()->withErrors([
                'general' => 'An error occurred while creating the employee. Please try again.'
            ])->withInput();
        } catch (\Exception $e) {
            // Handle any other errors
            return redirect()->back()->withErrors([
                'general' => 'An unexpected error occurred. Please try again.'
            ])->withInput();
        }
    }

    /**
     * Update the specified employee
     */
    public function update(Request $request, $id)
    {
        $currentUser = auth()->user();
        $employee = User::whereIn('user_type', [1, 2])->findOrFail($id);

        // Prevent non-System Administrators from editing their own account
        if (!$currentUser->isSystemAdministrator() && $currentUser->id == $id) {
            abort(403, 'You cannot edit your own account. Please contact a System Administrator.');
        }

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
        $currentUser = auth()->user();
        $employee = User::activeEmployees()->findOrFail($id);

        // Prevent non-System Administrators from archiving their own account
        if (!$currentUser->isSystemAdministrator() && $currentUser->id == $id) {
            abort(403, 'You cannot archive your own account. Please contact a System Administrator.');
        }

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
        $currentUser = auth()->user();
        $employee = User::archivedEmployees()->findOrFail($id);

        // Prevent non-System Administrators from restoring their own account
        if (!$currentUser->isSystemAdministrator() && $currentUser->id == $id) {
            abort(403, 'You cannot restore your own account. Please contact a System Administrator.');
        }

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
        $currentUser = auth()->user();
        $employee = User::archivedEmployees()->findOrFail($id);

        // Prevent non-System Administrators from permanently deleting their own account
        if (!$currentUser->isSystemAdministrator() && $currentUser->id == $id) {
            abort(403, 'You cannot permanently delete your own account. Please contact a System Administrator.');
        }
        
        // Log the activity before deletion
        if (auth()->check() && auth()->user() && is_numeric(auth()->user()->id)) {
            ActivityLog::log(
                'employee_deleted_permanently',
                "Permanently deleted employee: {$employee->name} (Position: {$employee->position}, Username: {$employee->username})",
                $employee,
                [
                    'name' => $employee->name,
                    'username' => $employee->username,
                    'position' => $employee->position,
                    'contact' => $employee->contact,
                    'user_type' => $employee->user_type,
                ],
                auth()->user()->id
            );
        }
        
        $employee->forceDelete();

        return redirect()->back()->with('success', 'Employee permanently deleted!');
    }

    /**
     * Toggle employee status
     */
    public function toggleStatus($id)
    {
        $currentUser = auth()->user();
        $employee = User::activeEmployees()->findOrFail($id);

        // Prevent non-System Administrators from changing their own status
        if (!$currentUser->isSystemAdministrator() && $currentUser->id == $id) {
            abort(403, 'You cannot change your own account status. Please contact a System Administrator.');
        }

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

    /**
     * Reset employee password to default (123)
     */
    public function resetPassword($id)
    {
        try {
            $employee = User::findOrFail($id);
            
            // Ensure the user is an employee (not admin)
            if ($employee->user_type === 0) {
                return redirect()->back()->withErrors(['error' => 'Cannot reset system administrator password.']);
            }
            // Reset password to default
            $employee->password = Hash::make('123');
            $employee->save();
            
            // Try to log the activity - but don't fail if logging fails
            try {
                $currentUser = auth()->user();
                if ($currentUser && $currentUser->id && is_numeric($currentUser->id)) {
                    ActivityLog::create([
                        'user_id' => (int) $currentUser->id,
                        'action' => 'Password Reset',
                        'description' => "Reset password for employee: {$employee->name}",
                    ]);
                }
            } catch (\Exception $e) {
                // Log the error but don't stop the password reset
                \Log::error('Failed to log password reset activity: ' . $e->getMessage());
            }
            
            return redirect()->back()->with('success', 'Employee password has been reset to default (123).');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to reset password: ' . $e->getMessage()]);
        }
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Get the authenticated user
        $user = Auth::user();
        
        // Log the login activity
        ActivityLog::log(
            'user_login',
            "User {$user->name} ({$user->username}) logged in",
            null,
            ['user_type' => $user->user_type == 1 ? 'Admin' : 'Employee'],
            $user->id
        );
        
        // Debug logging
        \Log::info('User authenticated:', [
            'id' => $user->id,
            'username' => $user->username,
            'user_type' => $user->user_type,
            'user_type_type' => gettype($user->user_type)
        ]);
        
        // Redirect based on user type
        if ($user->user_type == 1) {
            // Admin user - redirect to admin dashboard
            \Log::info('Redirecting to admin dashboard');
            return redirect()->route('admin.dashboard');
        } else {
            // Employee user - redirect to employee dashboard
            \Log::info('Redirecting to employee dashboard');
            return redirect()->route('employee.dashboard');
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        // Log the logout activity before logging out
        if ($user) {
            ActivityLog::log(
                'user_logout',
                "User {$user->name} ({$user->username}) logged out",
                null,
                ['user_type' => $user->user_type == 1 ? 'Admin' : 'Employee'],
                $user->id
            );
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}

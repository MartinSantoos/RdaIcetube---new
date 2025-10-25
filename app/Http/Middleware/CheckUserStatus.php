<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only check status for authenticated users
        if (Auth::check()) {
            $user = Auth::user();
            
            // If user is inactive, log them out and redirect to login
            if ($user->status !== 'active') {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                
                return redirect('/login')->withErrors([
                    'username' => 'Your account has been deactivated. Please contact an administrator.'
                ]);
            }
        }

        return $next($request);
    }
}

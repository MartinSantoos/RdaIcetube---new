<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckEmployee
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect('/login');
        }
        
        $user = auth()->user();
        
        if ($user->user_type !== 2) {
            abort(403, 'Access denied. Employee privileges required.');
        }

        // Check if user account is active
        if ($user->status !== 'active') {
            auth()->guard('web')->logout();
            return redirect('/login')->withErrors([
                'username' => 'Your account has been deactivated. Please contact an administrator.'
            ]);
        }

        return $next($request);
    }
}

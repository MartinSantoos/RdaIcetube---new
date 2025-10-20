<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $inputUsername = $this->input('username');
        
        // First, try to find user by the exact username
        $user = \App\Models\User::where('username', $inputUsername)->first();
        
        // If not found, try to find by name (display name) and convert to username
        if (!$user) {
            $userByName = \App\Models\User::where('name', $inputUsername)->first();
            if ($userByName) {
                // Update the request data to use the correct username
                $this->merge(['username' => $userByName->username]);
                $user = $userByName;
            }
        }
        
        // If still not found, try to generate username from input (remove spaces, lowercase)
        if (!$user) {
            $generatedUsername = strtolower(str_replace(' ', '', $inputUsername));
            $user = \App\Models\User::where('username', $generatedUsername)->first();
            if ($user) {
                // Update the request data to use the correct username
                $this->merge(['username' => $generatedUsername]);
            }
        }
        
        if (!$user) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'username' => 'The username does not exist in our system.',
            ]);
        }

        // Attempt authentication with the correct username
        if (! Auth::attempt($this->only('username', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'password' => 'The password is incorrect.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'username' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return $this->string('username')
            ->lower()
            ->append('|'.$this->ip())
            ->transliterate()
            ->value();
    }
}

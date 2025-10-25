<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The name of the "deleted at" column.
     *
     * @var string
     */
    const DELETED_AT = 'archived_at';

    /**
     * Get the name of the "deleted at" column.
     *
     * @return string
     */
    public function getDeletedAtColumn()
    {
        return defined('static::DELETED_AT') ? static::DELETED_AT : 'deleted_at';
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'user_type',
        'contact_number',
        'position',
        'status',
    ];

    /**
     * Get the name of the unique identifier for the user.
     *
     * @return string
     */
    public function getAuthIdentifierName()
    {
        return 'username';
    }

    /**
     * Get the username for authentication.
     *
     * @return string
     */
    public function username()
    {
        return 'username';
    }

    /**
     * Get the username attribute for authentication with automatic capitalization.
     *
     * @return string
     */
    public function getUsernameAttribute($value = null)
    {
        $rawValue = $value ?? $this->attributes['username'] ?? '';
        return ucfirst(strtolower($rawValue));
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * Scope to get employees and admins created through employee management (excluding system administrator position)
     */
    public function scopeEmployees($query)
    {
        return $query->whereIn('user_type', [1, 2])
                    ->where('position', '!=', 'System Administrator');
    }

    /**
     * Scope to get only archived employees
     */
    public function scopeArchivedEmployees($query)
    {
        return $query->employees()->onlyTrashed();
    }

    /**
     * Scope to get active employees (not archived)
     */
    public function scopeActiveEmployees($query)
    {
        return $query->employees()->whereNull('archived_at');
    }

    /**
     * Accessor to map contact_number to contact for frontend compatibility
     */
    public function getContactAttribute()
    {
        return $this->contact_number;
    }

    /**
     * Accessor to automatically capitalize the first letter of the name
     */
    public function getNameAttribute($value)
    {
        return ucfirst(strtolower($value ?? ''));
    }

    /**
     * Mutator to automatically capitalize the first letter of the name when storing
     */
    public function setNameAttribute($value)
    {
        $this->attributes['name'] = ucfirst(strtolower($value ?? ''));
    }

    /**
     * Mutator to automatically capitalize the first letter of the username when storing
     */
    public function setUsernameAttribute($value)
    {
        $this->attributes['username'] = ucfirst(strtolower($value ?? ''));
    }

    /**
     * Ensure contact is included in array/json representation
     */
    protected $appends = ['contact'];

    /**
     * Check if user is a System Administrator
     */
    public function isSystemAdministrator(): bool
    {
        return $this->position === 'System Administrator';
    }
}
